import type { Room, Season, ExtraService, Promotion, GiftVoucher, BookingGuestCounts, BookingExtra, PriceBreakdown, PriceLine } from "@/lib/types";
import type { RoomRateOverride } from "@/lib/data/seasons";

export const FREE_CHILD_AGE_THRESHOLD = 6;
export const TOURIST_TAX_PER_PERSON_PER_NIGHT = 2;
export const WEEKLY_STAY_DISCOUNT = 0.05;
export const WEEKLY_STAY_MIN_NIGHTS = 7;

/** Book at least this many days before check-in to get the early-booking discount. */
export const EARLY_BOOKING_MIN_DAYS_AHEAD = 30;
export const EARLY_BOOKING_DISCOUNT = 0.1;

/** Book within this many days of check-in to get the last-minute discount. */
export const LAST_MINUTE_MAX_DAYS_AHEAD = 3;
export const LAST_MINUTE_DISCOUNT = 0.15;

export function eachNight(checkIn: string, checkOut: string): Date[] {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const nights: Date[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    nights.push(new Date(d));
  }
  return nights;
}

function seasonForDate(date: Date, seasons: Season[]): Season | undefined {
  const time = date.getTime();
  return seasons.find((s) => time >= new Date(`${s.startDate}T00:00:00`).getTime() && time <= new Date(`${s.endDate}T23:59:59`).getTime());
}

function isWeekendNight(date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  return day === 5 || day === 6;
}

/** Guests old enough to be charged per-person (adults + children at/above the free-stay age threshold). */
function chargeableGuestCount(guests: BookingGuestCounts): number {
  const chargeableChildren = guests.childAges.filter((age) => age >= FREE_CHILD_AGE_THRESHOLD).length;
  return guests.adults + chargeableChildren;
}

export interface PricingInput {
  room: Room;
  checkIn: string;
  checkOut: string;
  guests: BookingGuestCounts;
  extras: BookingExtra[];
  seasons: Season[];
  services: ExtraService[];
  promotion?: Promotion;
  voucher?: GiftVoucher;
  rateOverrides?: RoomRateOverride[];
  /** Overrides the default tourist tax (admin-configurable in Settings). */
  touristTaxPerPersonPerNight?: number;
  /** Injectable for tests; defaults to the real current time. */
  now?: Date;
  currency?: string;
}

/** Throws a descriptive error the API routes turn into a 422 response. */
export function assertMinNightsSatisfied(checkIn: string, checkOut: string, seasons: Season[]): void {
  const nights = eachNight(checkIn, checkOut);
  for (const night of nights) {
    const season = seasonForDate(night, seasons);
    if (season?.minNights && nights.length < season.minNights) {
      throw new Error(`min_nights_${season.minNights}`);
    }
  }
}

export function calculateBookingPrice(input: PricingInput): PriceBreakdown {
  const { room, checkIn, checkOut, guests, extras, seasons, services, promotion, voucher, rateOverrides = [], now = new Date(), currency = "EUR", touristTaxPerPersonPerNight = TOURIST_TAX_PER_PERSON_PER_NIGHT } = input;
  const nights = eachNight(checkIn, checkOut);
  if (nights.length < 1) {
    throw new Error("invalid_dates");
  }

  assertMinNightsSatisfied(checkIn, checkOut, seasons);

  const lines: PriceLine[] = [];

  let roomSubtotal = 0;
  for (const night of nights) {
    const season = seasonForDate(night, seasons);
    const override = season ? rateOverrides.find((r) => r.roomId === room.id && r.seasonId === season.id) : undefined;
    const weekendMultiplier = season && isWeekendNight(night) ? season.weekendMultiplier : 1;
    if (override && override.overridePrice != null) {
      roomSubtotal += override.overridePrice * weekendMultiplier;
    } else {
      const seasonMultiplier = season?.multiplier ?? 1;
      roomSubtotal += room.basePrice * seasonMultiplier * weekendMultiplier;
    }
  }

  let weeklyDiscount = 0;
  if (nights.length >= WEEKLY_STAY_MIN_NIGHTS) {
    weeklyDiscount = roomSubtotal * WEEKLY_STAY_DISCOUNT;
    lines.push({ label: `Reducere sejur ${nights.length}+ nopți`, amount: -weeklyDiscount });
  }
  roomSubtotal -= weeklyDiscount;

  // Early-booking / last-minute dynamic pricing, based on how far ahead of
  // check-in the reservation is made. Mutually exclusive; early booking is
  // checked first since a farther-ahead booking is the more common case.
  const daysAhead = (new Date(`${checkIn}T00:00:00`).getTime() - now.getTime()) / 86_400_000;
  let dynamicDiscount = 0;
  if (daysAhead >= EARLY_BOOKING_MIN_DAYS_AHEAD) {
    dynamicDiscount = roomSubtotal * EARLY_BOOKING_DISCOUNT;
    lines.push({ label: "Reducere early booking", amount: -dynamicDiscount });
  } else if (daysAhead >= 0 && daysAhead <= LAST_MINUTE_MAX_DAYS_AHEAD) {
    dynamicDiscount = roomSubtotal * LAST_MINUTE_DISCOUNT;
    lines.push({ label: "Reducere last minute", amount: -dynamicDiscount });
  }
  roomSubtotal -= dynamicDiscount;

  lines.unshift({ label: `Cazare (${nights.length} ${nights.length === 1 ? "noapte" : "nopți"})`, amount: roomSubtotal });

  const chargeableGuests = chargeableGuestCount(guests);
  let extrasSubtotal = 0;
  for (const extra of extras) {
    const service = services.find((s) => s.id === extra.serviceId);
    if (!service) continue;
    const quantity = Math.max(1, extra.quantity);
    let amount = 0;
    switch (service.chargeType) {
      case "per_person":
        amount = service.price * chargeableGuests * quantity;
        break;
      case "per_night":
        amount = service.price * nights.length * quantity;
        break;
      case "per_room":
      case "per_booking":
      default:
        amount = service.price * quantity;
        break;
    }
    extrasSubtotal += amount;
    lines.push({ label: service.name.ro, amount });
  }

  let discountAmount = 0;
  const preDiscountSubtotal = roomSubtotal + extrasSubtotal;
  if (promotion && promotion.active) {
    discountAmount = promotion.type === "percentage" ? preDiscountSubtotal * (promotion.value / 100) : promotion.value;
    discountAmount = Math.min(discountAmount, preDiscountSubtotal);
    lines.push({ label: `Cod promoțional ${promotion.code}`, amount: -discountAmount });
  }

  const taxAmount = chargeableGuests * nights.length * touristTaxPerPersonPerNight;
  lines.push({ label: "Taxă turistică", amount: taxAmount });

  const runningTotal = preDiscountSubtotal - discountAmount + taxAmount;
  let voucherApplied = 0;
  if (voucher && voucher.active) {
    voucherApplied = Math.min(voucher.balance, runningTotal);
    if (voucherApplied > 0) lines.push({ label: `Voucher cadou ${voucher.code}`, amount: -voucherApplied });
  }

  const total = Math.max(0, runningTotal - voucherApplied);

  return {
    nights: nights.length,
    roomSubtotal,
    extrasSubtotal,
    discountAmount,
    taxAmount,
    voucherApplied,
    total,
    lines,
    currency,
  };
}
