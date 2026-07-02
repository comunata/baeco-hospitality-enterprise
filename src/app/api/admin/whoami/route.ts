import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Lightweight, client-polled check for the discreet footer admin icon: is
 * the current visitor an authenticated staff/manager/owner? Deliberately a
 * separate on-demand API route rather than a server-side check in the
 * public Footer/layout — the admin session read is cookie-bound, and
 * running it during every public page's server render would force every
 * SSG page (homepage, rooms, explore...) dynamic. This way the public
 * pages stay static; only this small client-side fetch touches cookies.
 */
export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, "admin-whoami", { maxRequests: 20, windowMs: 60_000 });
  if (limited) return limited;

  const session = await getAdminSession();
  const isStaff = session.authenticated && (session.demoMode || Boolean(session.role));
  return NextResponse.json({ isStaff });
}
