import "server-only";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedBookings } from "./seed/bookings";
import { getRoomBlocks } from "./availability";
import type { Booking, PriceBreakdown } from "@/lib/types";

/**
 * In-memory store used only when Supabase isn't configured, so the booking
 * flow (incl. the admin calendar) is fully testable without a database.
 * Starts pre-populated with seed bookings for a realistic admin/demo view;
 * resets on server restart — set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY /
 * SUPABASE_SERVICE_ROLE_KEY for real persistence.
 */
const memoryBookings: Booking[] = [...seedBookings];

// ---------------------------------------------------------------------------
// Row mapping. The bookings table is snake_case with flattened guest fields;
// the app type is camelCase with nested guest/guests. Without this mapping,
// inserts are rejected by PostgREST (unknown camelCase columns) and reads
// produce objects whose fields the app can't see — bookings would silently
// live only in the in-memory store even with Supabase fully configured.
// ---------------------------------------------------------------------------

interface BookingRow {
  id: string;
  code: string;
  room_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  child_ages: number[];
  infants: number;
  promo_code: string | null;
  voucher_code: string | null;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string | null;
  special_requests: string | null;
  status: Booking["status"];
  totals: PriceBreakdown;
  source: Booking["source"];
  created_at: string;
  group_code: string | null;
  checked_in_at: string | null;
  arrival_time: string | null;
  checkin_notes: string | null;
}

function fromRow(row: BookingRow): Booking {
  return {
    id: row.id,
    code: row.code,
    roomId: row.room_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: { adults: row.adults, children: row.children, childAges: row.child_ages ?? [], infants: row.infants ?? 0 },
    extras: [], // itemized extras live in totals.lines; the structured list isn't persisted as a column
    promoCode: row.promo_code ?? undefined,
    voucherCode: row.voucher_code ?? undefined,
    guest: {
      firstName: row.guest_first_name,
      lastName: row.guest_last_name,
      email: row.guest_email,
      phone: row.guest_phone ?? "",
    },
    specialRequests: row.special_requests ?? undefined,
    status: row.status,
    totals: row.totals,
    createdAt: row.created_at,
    source: row.source,
    groupCode: row.group_code ?? undefined,
    checkedInAt: row.checked_in_at ?? undefined,
    arrivalTime: row.arrival_time ?? undefined,
    checkinNotes: row.checkin_notes ?? undefined,
  };
}

function toRow(booking: Booking): Record<string, unknown> {
  return {
    code: booking.code,
    room_id: booking.roomId,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    adults: booking.guests.adults,
    children: booking.guests.children,
    child_ages: booking.guests.childAges,
    infants: booking.guests.infants,
    promo_code: booking.promoCode ?? null,
    voucher_code: booking.voucherCode ?? null,
    guest_first_name: booking.guest.firstName,
    guest_last_name: booking.guest.lastName,
    guest_email: booking.guest.email,
    guest_phone: booking.guest.phone || null,
    special_requests: booking.specialRequests ?? null,
    status: booking.status,
    totals: booking.totals,
    source: booking.source,
    group_code: booking.groupCode ?? null,
  };
}

function patchToRow(patch: Partial<Booking>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.specialRequests !== undefined) row.special_requests = patch.specialRequests;
  if (patch.checkedInAt !== undefined) row.checked_in_at = patch.checkedInAt;
  if (patch.arrivalTime !== undefined) row.arrival_time = patch.arrivalTime;
  if (patch.checkinNotes !== undefined) row.checkin_notes = patch.checkinNotes;
  row.updated_at = new Date().toISOString();
  return row;
}

/**
 * Booking codes are guessable/enumerable identifiers used to look up and
 * (via the portal) cancel/edit reservations, so they must not be predictable.
 * Math.random() is not a CSPRNG; crypto.randomBytes is. No ambiguous
 * characters (0/O, 1/I removed) so codes stay easy to read/type over phone.
 *
 * Format: BD-XXXXXX (6 chars, 33^6 ≈ 1.29 billion combinations — collisions
 * are checked against the DB/memory store below and retried, never left to
 * chance). The code is assigned once at booking creation and never changes.
 */
const BOOKING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BOOKING_CODE_LENGTH = 6;

export function generateBookingCode(): string {
  const bytes = randomBytes(BOOKING_CODE_LENGTH);
  let code = "";
  for (const byte of bytes) {
    code += BOOKING_CODE_ALPHABET[byte % BOOKING_CODE_ALPHABET.length];
  }
  return `BD-${code}`;
}

async function bookingCodeExists(code: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data } = await admin.from("bookings").select("id").or(`code.eq.${code},group_code.eq.${code}`).limit(1).maybeSingle();
      return Boolean(data);
    }
  }
  return memoryBookings.some((b) => b.code === code || b.groupCode === code);
}

/** Generates a booking code and retries on the (astronomically unlikely)
 * chance of a collision with an existing booking or group code. */
export async function generateUniqueBookingCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateBookingCode();
    if (!(await bookingCodeExists(code))) return code;
  }
  throw new Error("Nu s-a putut genera un cod de rezervare unic. Încearcă din nou.");
}

export async function createBooking(booking: Booking): Promise<Booking> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("bookings").insert(toRow(booking)).select().single();
      if (!error && data) return fromRow(data as BookingRow);
      // A booking that isn't persisted is lost revenue — fail loudly instead
      // of silently degrading to the ephemeral store when a DB exists.
      if (error) {
        console.error(`[bookings] insert failed: ${error.message}`);
        throw new Error(error.message);
      }
    }
  }
  memoryBookings.push(booking);
  return booking;
}

export async function getBookingsForRoom(roomId: string, from: string, to: string): Promise<Booking[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("room_id", roomId)
        .neq("status", "cancelled")
        .lt("check_in", to)
        .gt("check_out", from);
      if (!error && data) return (data as BookingRow[]).map(fromRow);
    }
  }
  return memoryBookings.filter((b) => b.roomId === roomId && b.status !== "cancelled" && b.checkIn < to && b.checkOut > from);
}

/**
 * Peak simultaneous occupancy of a room TYPE during a stay window: the
 * maximum number of overlapping active bookings on any single night. Two
 * back-to-back bookings don't stack; two fully-overlapping ones do.
 */
export async function getPeakOccupancy(roomId: string, checkIn: string, checkOut: string): Promise<number> {
  const overlapping = await getBookingsForRoom(roomId, checkIn, checkOut);
  if (overlapping.length === 0) return 0;
  let peak = 0;
  for (let t = new Date(checkIn); t < new Date(checkOut); t.setDate(t.getDate() + 1)) {
    const day = t.toISOString().slice(0, 10);
    const occupied = overlapping.filter((b) => b.checkIn <= day && b.checkOut > day).length;
    if (occupied > peak) peak = occupied;
  }
  return peak;
}

/**
 * Units of a room type still free across the whole stay. Real inventory:
 * a type with totalUnits=8 stays bookable until 8 stays overlap the same
 * night. Manual blocks (maintenance/closure) close the entire type.
 */
export async function getAvailableUnits(
  room: { id: string; totalUnits?: number },
  checkIn: string,
  checkOut: string
): Promise<number> {
  const totalUnits = Math.max(1, room.totalUnits ?? 1);
  const [peak, blocks] = await Promise.all([getPeakOccupancy(room.id, checkIn, checkOut), getRoomBlocks()]);

  const blocked = blocks.some((b) => b.roomId === room.id && b.startDate < checkOut && b.endDate > checkIn);
  if (blocked) return 0;

  return Math.max(0, totalUnits - peak);
}

export async function isRoomAvailable(
  room: { id: string; totalUnits?: number },
  checkIn: string,
  checkOut: string,
  unitsNeeded = 1
): Promise<boolean> {
  return (await getAvailableUnits(room, checkIn, checkOut)) >= unitsNeeded;
}

export async function getAllBookings(): Promise<Booking[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("bookings").select("*").order("check_in", { ascending: true });
      if (!error && data) return (data as BookingRow[]).map(fromRow);
    }
  }
  return memoryBookings;
}

export async function getBookingByCode(code: string): Promise<Booking | undefined> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("bookings").select("*").eq("code", code).maybeSingle();
      if (!error) return data ? fromRow(data as BookingRow) : undefined;
    }
  }
  return memoryBookings.find((b) => b.code === code);
}

/** All rooms of one multi-room reservation (or the single booking itself). */
export async function getBookingsForGroup(groupCode: string): Promise<Booking[]> {
  const bookings = await getAllBookings();
  return bookings.filter((b) => b.groupCode === groupCode || b.code === groupCode);
}

export async function getBookingsForGuestEmail(email: string): Promise<Booking[]> {
  const bookings = await getAllBookings();
  return bookings.filter((b) => b.guest.email.toLowerCase() === email.toLowerCase());
}

async function mutateBooking(code: string, patch: Partial<Booking>): Promise<Booking | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("bookings").update(patchToRow(patch)).eq("code", code).select().maybeSingle();
      if (!error && data) return fromRow(data as BookingRow);
    }
  }
  const booking = memoryBookings.find((b) => b.code === code);
  if (booking) Object.assign(booking, patch);
  return booking;
}

export const CANCELLATION_MIN_DAYS_BEFORE = 5;

export function canCancelFreely(checkIn: string): boolean {
  const daysUntilCheckIn = (new Date(checkIn).getTime() - Date.now()) / 86_400_000;
  return daysUntilCheckIn >= CANCELLATION_MIN_DAYS_BEFORE;
}

export async function cancelBooking(code: string): Promise<Booking | undefined> {
  return mutateBooking(code, { status: "cancelled" });
}

export async function updateBookingStatus(code: string, status: Booking["status"]): Promise<Booking | undefined> {
  return mutateBooking(code, { status });
}

export async function updateSpecialRequests(code: string, specialRequests: string): Promise<Booking | undefined> {
  return mutateBooking(code, { specialRequests });
}

/** Online check-in from the guest portal. */
export async function completeOnlineCheckIn(
  code: string,
  details: { arrivalTime: string; notes?: string }
): Promise<Booking | undefined> {
  return mutateBooking(code, {
    checkedInAt: new Date().toISOString(),
    arrivalTime: details.arrivalTime,
    checkinNotes: details.notes,
  });
}
