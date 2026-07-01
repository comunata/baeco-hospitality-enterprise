import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBookingByCode } from "@/lib/data/bookings";
import { getRooms } from "@/lib/data/rooms";
import { getServices } from "@/lib/data/services";
import { getPortalSession } from "@/lib/portal/session";
import { completeChat, isAiConfigured } from "@/lib/integrations/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/utils";
import { differenceInCalendarDays, parseISO } from "date-fns";

const requestSchema = z.object({
  code: z.string().min(1).max(64),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "ai-upsell", { maxRequests: 15, windowMs: 60_000 });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { code } = parsed.data;
  const locale = isLocale(parsed.data.locale ?? "") ? (parsed.data.locale as Locale) : defaultLocale;
  const dict = getDictionary(locale);

  // Only the guest owning the booking may receive upsell recommendations for
  // it — mirrors the ownership check on the booking detail page itself.
  const session = await getPortalSession();
  const booking = await getBookingByCode(code);
  if (!booking || !session.authenticated || booking.guest.email.toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [rooms, services] = await Promise.all([getRooms(), getServices()]);
  const room = rooms.find((r) => r.id === booking.roomId);
  const alreadyBookedServiceIds = new Set(booking.extras.map((e) => e.serviceId));
  const candidateServices = services.filter((s) => !alreadyBookedServiceIds.has(s.id));

  if (candidateServices.length === 0) {
    return NextResponse.json({ answer: dict.ai.upsell.empty, services: [] });
  }

  const nights = Math.max(1, differenceInCalendarDays(parseISO(booking.checkOut), parseISO(booking.checkIn)));

  const bookingFacts =
    `Rezervare ${booking.code}: cameră "${room?.name[locale] ?? room?.name.en ?? booking.roomId}", ` +
    `${nights} nopți, ${booking.guests.adults} adulți + ${booking.guests.children} copii, ` +
    `servicii deja incluse/adăugate: ${booking.extras.length > 0 ? [...alreadyBookedServiceIds].join(", ") : "niciunul"}.`;

  const serviceFacts = candidateServices
    .map(
      (s) =>
        `id=${s.id} | "${s.name[locale] ?? s.name.en}" | ${formatCurrency(s.price)} (${s.chargeType}) | ${s.description[locale] ?? s.description.en}`
    )
    .join("\n");

  if (await isAiConfigured()) {
    const answer = await completeChat([
      {
        role: "system",
        content:
          `You are the AI Upsell Assistant for ${dict.common.brand}. Recommend 2-4 extra services from the REAL service list ` +
          `below ONLY — never invent a service id, price, or name not present. Ground every recommendation in the guest's real ` +
          `booking details (room, nights, number of guests). Be concise and contextual (e.g. suggest breakfast for longer stays, ` +
          `spa for couples, kids' activities when there are children). Reply in ${locale === "ro" ? "Romanian" : "English"}.\n\n` +
          `${bookingFacts}\n\nAvailable extra services:\n${serviceFacts}`,
      },
      { role: "user", content: locale === "ro" ? "Ce servicii extra mi-ai recomanda pentru sejurul meu?" : "What extra services would you recommend for my stay?" },
    ]);
    if (answer) {
      return NextResponse.json({
        answer,
        services: candidateServices.slice(0, 4).map((s) => ({ id: s.id, name: s.name[locale] ?? s.name.en, price: s.price, chargeType: s.chargeType })),
      });
    }
  }

  // Deterministic fallback: simplest real match — up to 3 cheapest unbooked services.
  const sorted = [...candidateServices].sort((a, b) => a.price - b.price).slice(0, 3);
  const fallbackAnswer = sorted
    .map((s) => `${s.name[locale] ?? s.name.en} — ${formatCurrency(s.price)} (${s.chargeType})`)
    .join("\n");
  return NextResponse.json({
    answer: fallbackAnswer,
    services: sorted.map((s) => ({ id: s.id, name: s.name[locale] ?? s.name.en, price: s.price, chargeType: s.chargeType })),
  });
}
