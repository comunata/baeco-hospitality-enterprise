import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { getBookingByCode } from "@/lib/data/bookings";

export interface PortalSession {
  authenticated: boolean;
  demoMode: boolean;
  email: string;
  fullName?: string;
  /** The single booking this session was verified against — the Portal
   * Client has no accounts, so a session is always scoped to exactly one
   * booking (see docs on the login flow in api/portal/login/route.ts). */
  bookingCode?: string;
}

export const PORTAL_SESSION_COOKIE = "bd_portal_session";

/**
 * Signs the session token with HMAC-SHA256. Falls back to a fixed dev-only
 * secret (matching the "demo mode" pattern used across this codebase) if
 * PORTAL_SESSION_SECRET isn't set — sessions still work for local/demo use,
 * just aren't safe against forgery, so production must set a real secret.
 */
function getSecret(): string {
  return process.env.PORTAL_SESSION_SECRET ?? "dev-only-insecure-portal-secret-set-PORTAL_SESSION_SECRET-in-production";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Builds a `<bookingCode>.<expiresAtMs>.<hmac>` token — no session store
 * needed, the cookie itself carries everything, verified on every read. */
function buildToken(bookingCode: string, expiresAtMs: number): string {
  const payload = `${bookingCode}.${expiresAtMs}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string): { bookingCode: string; expiresAtMs: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [bookingCode, expiresAtStr, signature] = parts;
  const payload = `${bookingCode}.${expiresAtStr}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const expiresAtMs = Number(expiresAtStr);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) return null;
  return { bookingCode, expiresAtMs };
}

/**
 * Sets the portal session cookie, scoped to one booking, expiring at
 * checkout + 24h (per the "stay logged in until the day after checkout"
 * requirement) — after that the guest has to look their booking up again.
 * Must be called from a Route Handler or Server Action (cookies() write).
 */
export async function createPortalSession(bookingCode: string, checkOutDate: string): Promise<void> {
  const expiresAtMs = new Date(`${checkOutDate}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000;
  const token = buildToken(bookingCode, expiresAtMs);
  const store = await cookies();
  store.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAtMs),
  });
}

export async function clearPortalSession(): Promise<void> {
  const store = await cookies();
  store.delete(PORTAL_SESSION_COOKIE);
}

/**
 * Resolves the current guest session for the Portal Client from the signed
 * cookie above — no Supabase Auth, no accounts, no magic-link/OTP email.
 * Without Supabase configured (or without a valid cookie), falls back to
 * the bundled demo guest so the portal can still be reviewed end to end.
 */
export async function getPortalSession(): Promise<PortalSession> {
  const store = await cookies();
  const token = store.get(PORTAL_SESSION_COOKIE)?.value;
  if (token) {
    const verified = verifyToken(token);
    if (verified) {
      const booking = await getBookingByCode(verified.bookingCode);
      if (booking) {
        return {
          authenticated: true,
          demoMode: false,
          email: booking.guest.email,
          fullName: `${booking.guest.firstName} ${booking.guest.lastName}`.trim(),
          bookingCode: booking.code,
        };
      }
    }
  }
  return { authenticated: false, demoMode: false, email: "" };
}
