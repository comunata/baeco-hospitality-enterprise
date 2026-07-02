import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_WRITE_BLOCKED_MESSAGE } from "./constants";

export interface AdminSession {
  authenticated: boolean;
  demoMode: boolean;
  email?: string;
  fullName?: string;
  role?: string;
}

/**
 * The official Baeco Hospitality role model:
 * - SUPER_ADMIN: the one system operator — full access to everything,
 *   every property, user/role management, integrations, system config.
 *   Always passes every requireAdminRole/assertAdminRole check.
 * - DEMO_ADMIN: unlimited sales-demo accounts — full read access to every
 *   admin module, but EVERY write is blocked centrally in assertAdminRole
 *   below, regardless of which roles a given call site allows. Never add
 *   "DEMO_ADMIN" to an allow-list expecting it to grant write access — it
 *   can't, by design (see assertAdminRole).
 * - HOTEL_ADMIN: the paying customer's own operator account — full control
 *   of their property's day-to-day operations (rooms, bookings, rates,
 *   gallery, services, content, email, AI). Single-tenant today, so in
 *   practice this is "the" property; multi-property scoping is a separate,
 *   later phase (see property_id being unused across the data layer).
 */
export type AdminRole = "SUPER_ADMIN" | "DEMO_ADMIN" | "HOTEL_ADMIN";

function isAdminRole(role: string | undefined): role is AdminRole {
  return role === "SUPER_ADMIN" || role === "DEMO_ADMIN" || role === "HOTEL_ADMIN";
}


/**
 * Resolves the current admin session. When Supabase isn't configured yet,
 * the admin panel runs in demo mode (open access, clearly labeled) so the
 * whole module can be reviewed without a live Supabase project — distinct
 * from the DEMO_ADMIN *role*, which is a real authenticated account with a
 * real (but write-blocked) Supabase session.
 *
 * A deactivated user (users.active = false) is treated as unauthenticated
 * even with a still-valid Supabase Auth session cookie — Super Admin
 * "deactivate this Demo Admin" has to actually revoke access, not just
 * hide a UI toggle.
 */
export async function getAdminSession(): Promise<AdminSession> {
  if (!isSupabaseConfigured()) {
    return { authenticated: true, demoMode: true };
  }
  const supabase = await createClient();
  if (!supabase) return { authenticated: true, demoMode: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authenticated: false, demoMode: false };

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, active, roles(key)")
    .eq("id", user.id)
    .maybeSingle();
  const row = profile as unknown as { full_name?: string; active?: boolean; roles?: { key?: string } } | null;
  if (row && row.active === false) return { authenticated: false, demoMode: false };

  const role = row?.roles?.key;
  return { authenticated: true, demoMode: false, email: user.email ?? undefined, fullName: row?.full_name ?? undefined, role };
}

/**
 * Server-side guard for role-gated admin PAGES (Server Components) — reads
 * are allowed for DEMO_ADMIN regardless of the tuple, matching "poate
 * naviga prin toate modulele" — Demo Admin can view everything, only
 * writes (assertAdminRole below) are blocked.
 *
 * In demo mode (Supabase not configured) every check passes, so the whole
 * admin module remains reviewable without a live Supabase project.
 */
export async function requireAdminRole(...allowed: AdminRole[]): Promise<AdminSession> {
  const session = await getAdminSession();

  if (session.demoMode) return session;

  if (!session.authenticated) {
    redirect("/admin");
  }

  if (session.role === "SUPER_ADMIN" || session.role === "DEMO_ADMIN") return session;

  if (!isAdminRole(session.role) || !allowed.includes(session.role)) {
    throw new Error("forbidden: insufficient role for this admin section");
  }

  return session;
}

/**
 * Guard for every admin Server Action (mutation) — throws a plain Error
 * instead of redirecting, since actions run outside the render tree.
 *
 * DEMO_ADMIN is blocked here BEFORE the allow-list is even checked — this
 * is the single, central enforcement point for "Demo Admin can never
 * write," so no individual call site can accidentally grant it write
 * access by including "DEMO_ADMIN" in its tuple. SUPER_ADMIN always
 * passes, same as requireAdminRole.
 */
export async function assertAdminRole(...allowed: AdminRole[]): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session.demoMode) return session;
  if (!session.authenticated) throw new Error("unauthorized");
  if (session.role === "DEMO_ADMIN") throw new Error(DEMO_WRITE_BLOCKED_MESSAGE);
  if (session.role === "SUPER_ADMIN") return session;
  if (!isAdminRole(session.role) || !allowed.includes(session.role)) {
    throw new Error("forbidden: insufficient role for this action");
  }
  return session;
}
