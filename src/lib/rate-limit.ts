import "server-only";
import { NextRequest, NextResponse } from "next/server";

/**
 * Minimal in-memory, per-IP, fixed-window rate limiter. Not distributed —
 * fine for a single Node process; if the app ever scales to multiple
 * instances this should move to a shared store (e.g. Redis/Supabase).
 * No new dependencies: a Map with periodic cleanup is enough to close the
 * "no throttling on booking endpoints" gap flagged in the audit.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop stale buckets so the Map doesn't grow unbounded across
// the lifetime of the server process.
let lastCleanup = Date.now();
function cleanupIfNeeded(now: number) {
  if (now - lastCleanup < WINDOW_MS * 5) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key);
  }
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Returns a 429 NextResponse if the caller (identified by IP + route key)
 * has exceeded the allowed request rate, otherwise returns undefined so the
 * caller can proceed handling the request.
 */
export function checkRateLimit(
  request: NextRequest,
  routeKey: string,
  options?: { maxRequests?: number; windowMs?: number }
): NextResponse | undefined {
  const now = Date.now();
  cleanupIfNeeded(now);

  const maxRequests = options?.maxRequests ?? MAX_REQUESTS_PER_WINDOW;
  const windowMs = options?.windowMs ?? WINDOW_MS;
  const key = `${routeKey}:${getClientIp(request)}`;

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return undefined;
  }

  bucket.count += 1;
  if (bucket.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) } }
    );
  }
  return undefined;
}
