import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBookingByCode } from "@/lib/data/bookings";
import { createPortalSession } from "@/lib/portal/session";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  identifier: z.string().min(3).max(200),
  bookingCode: z.string().min(3).max(20),
});

function normalizeCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  return trimmed.startsWith("BD-") ? trimmed : `BD-${trimmed.replace(/^BD-?/, "")}`;
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** True if the identifier matches the booking's email (exact, case-
 * insensitive) or phone (digits-only, tolerant of a missing/extra country
 * code prefix — e.g. "0711111111" vs "+40711111111"). */
function identifierMatchesGuest(identifier: string, guest: { email: string; phone: string }): boolean {
  if (identifier.includes("@")) {
    return identifier.trim().toLowerCase() === guest.email.toLowerCase();
  }
  const a = normalizePhoneDigits(identifier);
  const b = normalizePhoneDigits(guest.phone);
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}

/**
 * Portal Client login: no Supabase Auth, no account, no magic-link/OTP
 * email — the guest proves ownership of a booking with what they already
 * have on the confirmation email (email-or-phone + the BD-XXXXXX code).
 * On success, a signed session cookie scoped to that one booking is set
 * (see lib/portal/session.ts), expiring at checkout + 24h.
 */
export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "portal-login", { maxRequests: 10, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const bookingCode = normalizeCode(parsed.data.bookingCode);
  const booking = await getBookingByCode(bookingCode);

  // Generic error either way — never reveal whether the code exists or the
  // identifier just didn't match, so a leaked/guessed code alone is useless.
  if (!booking || !identifierMatchesGuest(parsed.data.identifier, booking.guest)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await createPortalSession(booking.code, booking.checkOut);
  return NextResponse.json({ ok: true });
}
