import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRoomBySlug } from "@/lib/data/rooms";
import { getServices } from "@/lib/data/services";
import { getSeasons, getRoomRateOverrides } from "@/lib/data/seasons";
import { getPromotionByCode, getVoucherByCode, validatePromotionForStay } from "@/lib/data/promotions";
import { getBookingSettings } from "@/lib/data/settings";
import { calculateBookingPrice, eachNight } from "@/lib/pricing";
import { createBooking, generateBookingCode, getAvailableUnits } from "@/lib/data/bookings";
import { sendEmail } from "@/lib/integrations/email";
import { buildWhatsappLink, sendWhatsappTemplate } from "@/lib/integrations/whatsapp";
import { getPropertyContactInfo } from "@/lib/data/property";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { renderTemplate } from "@/lib/i18n/template";
import { formatCurrency, formatDate } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Booking, Room } from "@/lib/types";

const roomRequestSchema = z.object({
  roomSlug: z.string().min(1),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(10).default(0),
  childAges: z.array(z.number().int().min(0).max(17)).default([]),
  extras: z.array(z.object({ serviceId: z.string(), quantity: z.number().int().min(1).default(1) })).default([]),
});

/**
 * Accepts both the original single-room shape (roomSlug/adults/... at the
 * top level) and the multi-room shape (`rooms: [...]`) — one reservation
 * can book several rooms in a single flow; each room becomes its own
 * bookings row linked by a shared groupCode.
 */
const createSchema = z
  .object({
    rooms: z.array(roomRequestSchema).min(1).max(5).optional(),
    roomSlug: z.string().min(1).optional(),
    adults: z.number().int().min(1).max(20).optional(),
    children: z.number().int().min(0).max(10).default(0),
    childAges: z.array(z.number().int().min(0).max(17)).default([]),
    extras: z.array(z.object({ serviceId: z.string(), quantity: z.number().int().min(1).default(1) })).default([]),
    checkIn: z.string().min(10),
    checkOut: z.string().min(10),
    promoCode: z.string().optional(),
    voucherCode: z.string().optional(),
    locale: z.string().optional(),
    guest: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(5),
    }),
    specialRequests: z.string().optional(),
  })
  .refine((v) => (v.rooms && v.rooms.length > 0) || (v.roomSlug && v.adults), {
    message: "either rooms[] or roomSlug+adults is required",
  });

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "booking-create");
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;
  const locale = isLocale(input.locale ?? "") ? (input.locale as "ro" | "en") : defaultLocale;
  const dict = getDictionary(locale);

  if (new Date(input.checkOut) <= new Date(input.checkIn)) {
    return NextResponse.json({ error: "invalid_dates" }, { status: 422 });
  }

  const roomRequests = input.rooms ?? [
    { roomSlug: input.roomSlug!, adults: input.adults!, children: input.children, childAges: input.childAges, extras: input.extras },
  ];

  // Resolve + validate every requested room before creating anything.
  const resolved: Array<{ request: (typeof roomRequests)[number]; room: Room }> = [];
  for (const req of roomRequests) {
    const room = await getRoomBySlug(req.roomSlug);
    if (!room) return NextResponse.json({ error: "room_not_found", roomSlug: req.roomSlug }, { status: 404 });
    if (req.adults > room.maxAdults || req.children > room.maxChildren) {
      return NextResponse.json({ error: "capacity_exceeded", roomSlug: req.roomSlug }, { status: 422 });
    }
    resolved.push({ request: req, room });
  }

  // Real inventory check: units needed per room TYPE (booking the same type
  // twice needs 2 free units), against overlapping bookings + manual blocks.
  const unitsNeeded = new Map<string, { room: Room; count: number }>();
  for (const { room } of resolved) {
    const entry = unitsNeeded.get(room.id) ?? { room, count: 0 };
    entry.count += 1;
    unitsNeeded.set(room.id, entry);
  }
  for (const { room, count } of unitsNeeded.values()) {
    const free = await getAvailableUnits(room, input.checkIn, input.checkOut);
    if (free < count) {
      return NextResponse.json({ error: "room_unavailable", roomSlug: room.slug, unitsLeft: free }, { status: 409 });
    }
  }

  if (input.promoCode && input.promoCode.trim()) {
    const promoCandidate = await getPromotionByCode(input.promoCode);
    if (!promoCandidate) return NextResponse.json({ error: "promo_invalid" }, { status: 400 });
  }
  if (input.voucherCode && input.voucherCode.trim()) {
    const voucherCandidate = await getVoucherByCode(input.voucherCode);
    if (!voucherCandidate) return NextResponse.json({ error: "voucher_invalid" }, { status: 400 });
  }

  const [services, seasons, rateOverrides, bookingSettings, promotion, voucher] = await Promise.all([
    getServices(),
    getSeasons(),
    getRoomRateOverrides(),
    getBookingSettings(),
    input.promoCode ? getPromotionByCode(input.promoCode) : Promise.resolve(undefined),
    input.voucherCode ? getVoucherByCode(input.voucherCode) : Promise.resolve(undefined),
  ]);

  if (promotion) {
    const nights = eachNight(input.checkIn, input.checkOut).length;
    const promoError = validatePromotionForStay(promotion, {
      nights,
      subtotal: resolved[0].room.basePrice * nights,
    });
    if (promoError) return NextResponse.json({ error: promoError }, { status: 400 });
  }

  // Price every room; promo/voucher apply once, to the first room only —
  // never multiplied across the rooms of one group reservation.
  const groupCode = generateBookingCode();
  const bookings: Booking[] = [];
  try {
    for (const [index, { request: req, room }] of resolved.entries()) {
      const totals = calculateBookingPrice({
        room,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: { adults: req.adults, children: req.children, childAges: req.childAges, infants: 0 },
        extras: req.extras,
        seasons,
        services,
        promotion: index === 0 ? promotion : undefined,
        voucher: index === 0 ? voucher : undefined,
        rateOverrides,
        touristTaxPerPersonPerNight: bookingSettings.touristTaxPerPersonPerNight,
      });
      bookings.push({
        id: crypto.randomUUID(),
        code: resolved.length === 1 ? groupCode : generateBookingCode(),
        roomId: room.id,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: { adults: req.adults, children: req.children, childAges: req.childAges, infants: 0 },
        extras: req.extras,
        promoCode: index === 0 ? input.promoCode : undefined,
        voucherCode: index === 0 ? input.voucherCode : undefined,
        guest: input.guest,
        specialRequests: input.specialRequests,
        status: "pending",
        totals,
        createdAt: new Date().toISOString(),
        source: "website",
        groupCode: resolved.length > 1 ? groupCode : undefined,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_dates";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const created: Booking[] = [];
  for (const booking of bookings) {
    created.push(await createBooking(booking));
  }

  const grandTotal = created.reduce((sum, b) => sum + b.totals.total, 0);
  const currency = created[0].totals.currency;

  const roomLines = created
    .map((b) => {
      const room = resolved.find((r) => r.room.id === b.roomId)?.room;
      const roomName = room ? room.name[locale] ?? room.name.en : b.roomId;
      return `<li>${roomName} — ${b.code} — ${formatCurrency(b.totals.total, currency)}</li>`;
    })
    .join("");

  const primaryRoom = resolved[0].room;
  const contact = await getPropertyContactInfo();
  const emailVars = {
    propertyName: siteConfig.name,
    guestName: `${input.guest.firstName} ${input.guest.lastName}`,
    roomName: resolved.length > 1 ? `${resolved.length} camere` : primaryRoom.name[locale] ?? primaryRoom.name.en,
    checkIn: formatDate(input.checkIn, locale === "ro" ? "ro-RO" : "en-GB"),
    checkOut: formatDate(input.checkOut, locale === "ro" ? "ro-RO" : "en-GB"),
  };
  const notificationVars = { ...emailVars, bookingCode: groupCode };

  // Two distinct audiences, two distinct templates — never swapped:
  // - guestConfirmationTemplate: 2nd person ("your booking"), sent to the
  //   email/phone the guest typed into the booking form.
  // - propertyNotificationTemplate: 3rd person internal alert ("new booking
  //   received"), sent to the property's own contact email/WhatsApp. It
  //   must never carry the guest-worded confirmation text.
  const guestConfirmationTemplate = dict.emails.bookingConfirmation;
  const propertyNotificationTemplate = dict.emails.propertyBookingNotification;

  // Notification delivery is best-effort and independent per channel: a
  // failure sending one (email provider down, WhatsApp API misconfigured)
  // must never skip the others or fail the booking itself, which is
  // already committed at this point.
  try {
    const result = await sendEmail({
      to: input.guest.email,
      subject: renderTemplate(guestConfirmationTemplate.subject, emailVars),
      html:
        `<h1>${renderTemplate(guestConfirmationTemplate.heading, emailVars)}</h1>` +
        `<p>${renderTemplate(guestConfirmationTemplate.body, emailVars)}</p>` +
        `<ul>${roomLines}</ul>` +
        `<p><strong>Total: ${formatCurrency(grandTotal, currency)}</strong></p>` +
        `<p>${dict.booking.summary}: ${groupCode}</p>`,
    });
    if (!result.sent) console.error(`[booking:${groupCode}] guest confirmation email not sent (provider=${result.provider}) to=${input.guest.email}`);
  } catch (err) {
    // A non-OK provider response is handled above (result.sent === false,
    // already logged by the adapter); this only catches a thrown/network
    // failure that never produced a response.
    console.error(`[booking:${groupCode}] guest confirmation email threw`, err);
  }

  try {
    if (input.guest.phone) {
      await sendWhatsappTemplate(input.guest.phone, renderTemplate(dict.whatsapp.confirmation, notificationVars));
    }
  } catch (err) {
    console.error(`[booking:${groupCode}] guest WhatsApp confirmation threw`, err);
  }

  try {
    const result = await sendEmail({
      to: contact.email,
      subject: renderTemplate(propertyNotificationTemplate.subject, notificationVars),
      html:
        `<h1>${renderTemplate(propertyNotificationTemplate.heading, notificationVars)}</h1>` +
        `<p>${renderTemplate(propertyNotificationTemplate.body, notificationVars)}</p>` +
        `<ul>${roomLines}</ul>` +
        `<p><strong>Total: ${formatCurrency(grandTotal, currency)}</strong></p>`,
    });
    if (!result.sent) console.error(`[booking:${groupCode}] property notification email not sent (provider=${result.provider}) to=${contact.email}`);
  } catch (err) {
    console.error(`[booking:${groupCode}] property notification email threw`, err);
  }

  // The "message us on WhatsApp" link on the confirmation screen opens a
  // chat addressed to the PROPERTY's number, so it must carry the property
  // notification wording, not the guest-worded confirmation text.
  const propertyWhatsappMessage = renderTemplate(dict.whatsapp.adminNotification, notificationVars);

  return NextResponse.json({
    booking: created[0], // backward-compatible single-room shape
    bookings: created,
    groupCode,
    grandTotal,
    whatsappLink: buildWhatsappLink(propertyWhatsappMessage, contact.whatsapp),
  });
}
