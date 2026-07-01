import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRoomBySlug } from "@/lib/data/rooms";
import { getServices } from "@/lib/data/services";
import { getSeasons, getRoomRateOverrides } from "@/lib/data/seasons";
import { getPromotionByCode, getVoucherByCode, validatePromotionForStay } from "@/lib/data/promotions";
import { calculateBookingPrice, eachNight } from "@/lib/pricing";
import { checkRateLimit } from "@/lib/rate-limit";

const quoteSchema = z.object({
  roomSlug: z.string().min(1),
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(10).default(0),
  childAges: z.array(z.number().int().min(0).max(17)).default([]),
  extras: z.array(z.object({ serviceId: z.string(), quantity: z.number().int().min(1).default(1) })).default([]),
  promoCode: z.string().optional(),
  voucherCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "booking-quote");
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  if (new Date(input.checkOut) <= new Date(input.checkIn)) {
    return NextResponse.json({ error: "invalid_dates" }, { status: 422 });
  }

  const room = await getRoomBySlug(input.roomSlug);
  if (!room) return NextResponse.json({ error: "room_not_found" }, { status: 404 });

  if (input.adults > room.maxAdults || input.children > room.maxChildren) {
    return NextResponse.json({ error: "capacity_exceeded" }, { status: 422 });
  }

  // If a promo code was supplied but doesn't resolve to an active/valid
  // promotion, fail loudly instead of silently ignoring it — the client
  // must not be able to tell the difference between "no code" and "bad code".
  if (input.promoCode && input.promoCode.trim()) {
    const promoCandidate = await getPromotionByCode(input.promoCode);
    if (!promoCandidate) {
      return NextResponse.json({ error: "promo_invalid" }, { status: 400 });
    }
  }
  if (input.voucherCode && input.voucherCode.trim()) {
    const voucherCandidate = await getVoucherByCode(input.voucherCode);
    if (!voucherCandidate) {
      return NextResponse.json({ error: "voucher_invalid" }, { status: 400 });
    }
  }

  const [services, seasons, rateOverrides, promotion, voucher] = await Promise.all([
    getServices(),
    getSeasons(),
    getRoomRateOverrides(),
    input.promoCode ? getPromotionByCode(input.promoCode) : Promise.resolve(undefined),
    input.voucherCode ? getVoucherByCode(input.voucherCode) : Promise.resolve(undefined),
  ]);

  if (promotion) {
    const nights = eachNight(input.checkIn, input.checkOut).length;
    const promoError = validatePromotionForStay(promotion, { nights, subtotal: room.basePrice * nights });
    if (promoError) return NextResponse.json({ error: promoError }, { status: 400 });
  }

  try {
    const breakdown = calculateBookingPrice({
      room,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: { adults: input.adults, children: input.children, childAges: input.childAges, infants: 0 },
      extras: input.extras,
      seasons,
      services,
      promotion,
      voucher,
      rateOverrides,
    });
    return NextResponse.json({
      breakdown,
      promoApplied: Boolean(promotion),
      voucherApplied: Boolean(voucher),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_dates";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
