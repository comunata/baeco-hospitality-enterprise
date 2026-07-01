import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AdminSession {
  authenticated: boolean;
  demoMode: boolean;
  email?: string;
  role?: string;
}

/** Roles allowed into the admin panel at all, from least to most privileged. */
export type AdminRole = "staff" | "manager" | "owner";
const ROLE_RANK: Record<AdminRole, number> = { staff: 1, manager: 2, owner: 3 };

function isAdminRole(role: string | undefined): role is AdminRole {
  return role === "staff" || role === "manager" || role === "owner";
}

/**
 * Resolves the current admin session. When Supabase isn't configured yet,
 * the admin panel runs in demo mode (open access, clearly labeled) so the
 * whole module can be reviewed before wiring up real authentication.
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

  const { data: profile } = await supabase.from("users").select("role_id, roles(key)").eq("id", user.id).maybeSingle();
  const role = (profile as unknown as { roles?: { key?: string } } | null)?.roles?.key;

  return { authenticated: true, demoMode: false, email: user.email ?? undefined, role };
}

/**
 * Server-side guard for role-gated admin pages and Server Actions
 * (defense in depth — this is in addition to, not instead of, RLS policies).
 * Usage in a Server Component: `await requireAdminRole("owner", "manager")`.
 * Usage in a Server Action: same call at the top of the action body; throws
 * instead of redirecting since actions can't return a redirect mid-mutation
 * in all call sites, so callers should catch and surface the error, or rely
 * on the thrown error surfacing as a form error boundary.
 *
 * In demo mode (Supabase not configured) every role check passes, so the
 * whole admin module remains reviewable without a live Supabase project.
 */
export async function requireAdminRole(...allowed: AdminRole[]): Promise<AdminSession> {
  const session = await getAdminSession();

  if (session.demoMode) return session;

  if (!session.authenticated) {
    redirect("/admin");
  }

  if (!isAdminRole(session.role) || !allowed.includes(session.role)) {
    throw new Error("forbidden: insufficient role for this admin section");
  }

  return session;
}

/** Same check as requireAdminRole but for Server Actions — throws a plain
 * Error instead of redirecting, since actions run outside the render tree. */
export async function assertAdminRole(...allowed: AdminRole[]): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session.demoMode) return session;
  if (!session.authenticated) throw new Error("unauthorized");
  if (!isAdminRole(session.role) || !allowed.includes(session.role)) {
    throw new Error("forbidden: insufficient role for this action");
  }
  return session;
}

/** Rank comparison helper, e.g. hasRoleAtLeast(session.role, "manager"). */
export function hasRoleAtLeast(role: string | undefined, min: AdminRole): boolean {
  return isAdminRole(role) && ROLE_RANK[role] >= ROLE_RANK[min];
}
