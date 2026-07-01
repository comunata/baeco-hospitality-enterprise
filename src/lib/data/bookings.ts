import "server-only";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedBookings } from "./seed/bookings";
import { getRoomBlocks } from "./availability";
import type { Booking } from "@/lib/types";

/**
 * In-memory store used only when Supabase isn't configured, so the booking
 * flow (incl. the admin calendar) is fully testable without a database.
 * Starts pre-populated with seed bookings for a realistic admin/demo view;
 * resets on server restart — set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY /
 * SUPABASE_SERVICE_ROLE_KEY for real persistence.
 */
const memoryBookings: Booking[] = [...seedBookings];

/**
 * Booking codes are guessable/enumerable identifiers used to look up and
 * (via the portal) cancel/edit reservations, so they must not be predictable.
 * Math.random() is not a CSPRNG; crypto.randomBytes is, and this produces a
 * longer, base32-ish code with no ambiguous characters (0/O, 1/I removed).
 */
const BOOKING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingCode(): string {
  const bytes = randomBytes(10);
  let code = "";
  for (const byte of bytes) {
    code += BOOKING_CODE_ALPHABET[byte % BOOKING_CODE_ALPHABET.length];
  }
  return `BH-${code}`;
}

export async function createBooking(booking: Booking): Promise<Booking> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("bookings").insert(booking).select().single();
      if (!error && data) return data as unknown as Booking;
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
        .lte("check_in", to)
        .gte("check_out", from);
      if (!error && data) return data as unknown as Booking[];
    }
  }
  return memoryBookings.filter((b) => b.roomId === roomId && b.status !== "cancelled" && b.checkIn < to && b.checkOut > from);
}

/**
 * Live availability: a room is available only if it has no overlapping
 * active bookings AND none of its nights fall inside a manual room_blocks
 * range (maintenance/closure, set from /admin/availability).
 */
export async function isRoomAvailable(roomId: string, checkIn: string, checkOut: string): Promise<boolean> {
  const [overlapping, blocks] = await Promise.all([getBookingsForRoom(roomId, checkIn, checkOut), getRoomBlocks()]);
  if (overlapping.length > 0) return false;

  const roomBlocks = blocks.filter((b) => b.roomId === roomId);
  if (roomBlocks.length === 0) return true;

  // A block [start, end) overlaps the requested stay [checkIn, checkOut) if
  // it starts before the stay ends and ends after the stay starts.
  return !roomBlocks.some((b) => b.startDate < checkOut && b.endDate > checkIn);
}

export async function getAllBookings(): Promise<Booking[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("bookings").select("*").order("check_in", { ascending: true });
      if (!error && data) return data as unknown as Booking[];
    }
  }
  return memoryBookings;
}

export async function getBookingByCode(code: string): Promise<Booking | undefined> {
  const bookings = await getAllBookings();
  return bookings.find((b) => b.code === code);
}

export async function getBookingsForGuestEmail(email: string): Promise<Booking[]> {
  const bookings = await getAllBookings();
  return bookings.filter((b) => b.guest.email.toLowerCase() === email.toLowerCase());
}

async function mutateBooking(code: string, patch: Partial<Booking>): Promise<Booking | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("bookings").update(patch).eq("code", code).select().maybeSingle();
      if (!error && data) return data as unknown as Booking;
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

export async function updateSpecialRequests(code: string, specialRequests: string): Promise<Booking | undefined> {
  return mutateBooking(code, { specialRequests });
}
