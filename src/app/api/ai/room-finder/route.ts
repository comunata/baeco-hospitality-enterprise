import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRooms } from "@/lib/data/rooms";
import { getServices } from "@/lib/data/services";
import { getSeasons, getRoomRateOverrides } from "@/lib/data/seasons";
import { getAvailableUnits } from "@/lib/data/bookings";
import { getBookingSettings, isModuleEnabledRuntime } from "@/lib/data/settings";
import { calculateBookingPrice } from "@/lib/pricing";
import { completeChatDetailed, isAiConfigured } from "@/lib/integrations/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/utils";
import type { Room } from "@/lib/types";

/**
 * AI Booking Assistant. Not a chatbot: for the requested stay it reads the
 * real rooms, live unit availability and the actual price engine, then
 * recommends, compares and links straight into the booking flow. The LLM
 * only phrases the comparison — every number comes from the pricing engine.
 */
const requestSchema = z.object({
  locale: z.string().optional(),
  adults: z.number().int().min(1).max(20).optional(),
  children: z.number().int().min(0).max(20).optional(),
  budgetPerNight: z.number().min(0).max(100000).optional(),
  preferences: z.string().max(500).optional(),
  checkIn: z.string().min(10).optional(),
  checkOut: z.string().min(10).optional(),
});

interface RoomOffer {
  id: string;
  slug: string;
  name: string;
  price: number;
  totalEstimate?: number;
  nights?: number;
  available?: boolean;
  unitsLeft?: number;
  bookingUrl: string;
}

function describeRoom(room: Room, locale: Locale, offer: RoomOffer): string {
  const priceInfo = offer.totalEstimate !== undefined
    ? `total sejur ${formatCurrency(offer.totalEstimate)} (${offer.nights} nopți)${offer.available === false ? " | INDISPONIBILĂ pe datele cerute" : ` | ${offer.unitsLeft} unități libere`}`
    : `${formatCurrency(room.basePrice)}/noapte`;
  return (
    `id=${room.id} | "${room.name[locale] ?? room.name.en}" | ${priceInfo} | ` +
    `max ${room.maxAdults} adulți + ${room.maxChildren} copii | ${room.sizeSqm} m² | paturi: ${room.beds.join(", ")} | ` +
    `dotări: ${room.amenities.join(", ")} | descriere: ${room.description[locale] ?? room.description.en}`
  );
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "ai-room-finder", { maxRequests: 15, windowMs: 60_000 });
  if (limited) return limited;

  if (!(await isModuleEnabledRuntime("aiBookingAssistant"))) {
    return NextResponse.json({ error: "module_disabled" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { adults, children, budgetPerNight, preferences } = parsed.data;
  const locale = isLocale(parsed.data.locale ?? "") ? (parsed.data.locale as Locale) : defaultLocale;
  const dict = getDictionary(locale);

  const hasStayDates = Boolean(
    parsed.data.checkIn && parsed.data.checkOut && new Date(parsed.data.checkOut) > new Date(parsed.data.checkIn)
  );
  const checkIn = hasStayDates ? parsed.data.checkIn! : undefined;
  const checkOut = hasStayDates ? parsed.data.checkOut! : undefined;

  const rooms = await getRooms();

  // Real, grounded pre-filter — never let the LLM invent capacity/pricing
  // that doesn't exist. Filter by hard constraints first, then let the
  // model rank/explain among the real candidates.
  let candidates = rooms;
  if (adults !== undefined) candidates = candidates.filter((r) => r.maxAdults >= adults);
  if (children !== undefined) candidates = candidates.filter((r) => r.maxChildren >= children);
  if (budgetPerNight !== undefined) candidates = candidates.filter((r) => r.basePrice <= budgetPerNight);

  // If hard filters eliminate everything, fall back to the full real list so
  // the assistant can still explain trade-offs (e.g. "nothing fits your
  // budget, closest options are X and Y") instead of returning nothing.
  const pool = candidates.length > 0 ? candidates : rooms;
  if (pool.length === 0) {
    return NextResponse.json({ answer: dict.ai.roomFinder.noResults, rooms: [] });
  }

  // With stay dates: real availability + real quote per candidate, from the
  // same pricing engine the booking flow uses (seasons, dynamic discounts,
  // tourist tax) — the estimate matches what the guest will actually pay.
  const offers = new Map<string, RoomOffer>();
  if (checkIn && checkOut) {
    const [services, seasons, rateOverrides, bookingSettings] = await Promise.all([
      getServices(),
      getSeasons(),
      getRoomRateOverrides(),
      getBookingSettings(),
    ]);
    for (const room of pool) {
      const bookingUrl = `/${locale}/booking?room=${room.slug}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults ?? 2}&children=${children ?? 0}`;
      try {
        const unitsLeft = await getAvailableUnits(room, checkIn, checkOut);
        const breakdown = calculateBookingPrice({
          room,
          checkIn,
          checkOut,
          guests: { adults: adults ?? 2, children: children ?? 0, childAges: [], infants: 0 },
          extras: [],
          seasons,
          services,
          rateOverrides,
          touristTaxPerPersonPerNight: bookingSettings.touristTaxPerPersonPerNight,
        });
        offers.set(room.id, {
          id: room.id,
          slug: room.slug,
          name: room.name[locale] ?? room.name.en,
          price: room.basePrice,
          totalEstimate: breakdown.total,
          nights: breakdown.nights,
          available: unitsLeft > 0,
          unitsLeft,
          bookingUrl,
        });
      } catch {
        offers.set(room.id, { id: room.id, slug: room.slug, name: room.name[locale] ?? room.name.en, price: room.basePrice, bookingUrl });
      }
    }
  } else {
    for (const room of pool) {
      offers.set(room.id, {
        id: room.id,
        slug: room.slug,
        name: room.name[locale] ?? room.name.en,
        price: room.basePrice,
        bookingUrl: `/${locale}/booking?room=${room.slug}&adults=${adults ?? 2}&children=${children ?? 0}`,
      });
    }
  }

  // Available rooms first, then by estimated total (or base price).
  const ranked = [...pool].sort((a, b) => {
    const oa = offers.get(a.id)!;
    const ob = offers.get(b.id)!;
    if ((oa.available === false) !== (ob.available === false)) return oa.available === false ? 1 : -1;
    return (oa.totalEstimate ?? oa.price) - (ob.totalEstimate ?? ob.price);
  });
  const topOffers = ranked.slice(0, 3).map((r) => offers.get(r.id)!);
  const roomFacts = ranked.map((r) => describeRoom(r, locale, offers.get(r.id)!)).join("\n");

  let engineReason: string | undefined;
  if (await isAiConfigured()) {
    const result = await completeChatDetailed([
      {
        role: "system",
        content:
          `You are the AI Booking Assistant for ${dict.common.brand}, a luxury hospitality property. ` +
          `Recommend 1-3 rooms from the REAL room list below ONLY — never invent a room, price, capacity or availability. ` +
          `Reference rooms by their exact name. Compare the recommended rooms briefly (size, beds, amenities, price difference) ` +
          `so the guest understands the trade-offs, and state the real total estimate for the stay when present. ` +
          `If a room is marked unavailable for the requested dates, say so and steer to an available one. ` +
          `Close by inviting the guest to book. Reply in ${locale === "ro" ? "Romanian" : "English"}.\n\n` +
          `Real rooms:\n${roomFacts}`,
      },
      {
        role: "user",
        content:
          `Adulți: ${adults ?? "nespecificat"}. Copii: ${children ?? "nespecificat"}. ` +
          `Perioadă: ${checkIn && checkOut ? `${checkIn} → ${checkOut}` : "nespecificată"}. ` +
          `Buget/noapte: ${budgetPerNight !== undefined ? formatCurrency(budgetPerNight) : "nespecificat"}. ` +
          `Dorințe: ${preferences?.trim() || "nespecificate"}.`,
      },
    ]);
    if (result.content) {
      return NextResponse.json({ answer: result.content, rooms: topOffers, engine: "openai" });
    }
    engineReason = result.reason;
  } else {
    engineReason = "no_api_key";
  }

  // Deterministic fallback (no AI key / API error): ranked real offers.
  const fallbackAnswer = topOffers
    .map((offer) => {
      const room = pool.find((r) => r.id === offer.id)!;
      const priceText = offer.totalEstimate !== undefined
        ? `${formatCurrency(offer.totalEstimate)} / ${offer.nights} ${offer.nights === 1 ? "noapte" : "nopți"}${offer.available === false ? " — indisponibilă pe datele cerute" : ""}`
        : `${formatCurrency(offer.price)}/noapte`;
      return `${offer.name} — ${priceText}, max ${room.maxAdults}+${room.maxChildren}, ${room.sizeSqm} m².`;
    })
    .join("\n");

  return NextResponse.json({ answer: fallbackAnswer, rooms: topOffers, engine: "rules", engineReason });
}
