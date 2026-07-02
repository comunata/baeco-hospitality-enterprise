import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBookingByCode, cancelBooking, updateSpecialRequests, canCancelFreely } from "@/lib/data/bookings";
import { getRoomById } from "@/lib/data/rooms";
import { getPortalSession } from "@/lib/portal/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/integrations/email";
import { sendWhatsappTemplate } from "@/lib/integrations/whatsapp";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale } from "@/lib/i18n/config";
import { renderTemplate } from "@/lib/i18n/template";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const patchSchema = z.object({
  action: z.enum(["cancel", "special_requests"]),
  specialRequests: z.string().max(2000).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const rateLimited = checkRateLimit(request, "portal-booking-patch");
  if (rateLimited) return rateLimited;

  const { code } = await params;
  const booking = await getBookingByCode(code);
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Authorization: the caller must be an authenticated portal session whose
  // email matches the booking's guest email. This closes an IDOR where any
  // caller could PATCH (cancel / edit special requests on) any booking code,
  // since the code alone is guessable/enumerable and this route used to
  // trust it as sufficient proof of ownership.
  const session = await getPortalSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.email.toLowerCase() !== booking.guest.email.toLowerCase()) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  if (parsed.data.action === "cancel") {
    const free = canCancelFreely(booking.checkIn);
    const updated = await cancelBooking(code);

    // Notify the guest by email + WhatsApp (best-effort — a delivery
    // failure here must not roll back or fail the cancellation itself).
    const dict = getDictionary(defaultLocale);
    const room = await getRoomById(booking.roomId);
    const roomName = room?.name[defaultLocale] ?? room?.name.en ?? booking.roomId;
    const vars = {
      propertyName: siteConfig.name,
      guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
      roomName,
      checkIn: formatDate(booking.checkIn, "ro-RO"),
      checkOut: formatDate(booking.checkOut, "ro-RO"),
      bookingCode: booking.code,
    };
    try {
      await sendEmail({
        to: booking.guest.email,
        subject: renderTemplate(dict.emails.cancellation.subject, vars),
        html: `<h1>${renderTemplate(dict.emails.cancellation.heading, vars)}</h1><p>${renderTemplate(
          dict.emails.cancellation.body,
          vars
        )}</p><p>${dict.booking.summary}: ${booking.code}</p>`,
      });
      if (booking.guest.phone) {
        await sendWhatsappTemplate(booking.guest.phone, renderTemplate(dict.whatsapp.cancellation, vars));
      }
    } catch (err) {
      // Never block cancellation on a notification failure — just log it.
      console.error(`[booking:${booking.code}] cancellation notification threw`, err);
    }

    return NextResponse.json({ booking: updated, freeCancellation: free });
  }

  const updated = await updateSpecialRequests(code, parsed.data.specialRequests ?? "");
  return NextResponse.json({ booking: updated });
}
