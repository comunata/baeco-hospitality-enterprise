import "server-only";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AdminRole } from "@/lib/admin/session";

/**
 * Admin user management — Super Admin only (see requireAdminRole/
 * assertAdminRole("SUPER_ADMIN") gates on every caller). Admin accounts
 * are provisioned here rather than via self-service sign-up, same
 * philosophy as the existing AdminLoginForm ("staff shouldn't be able to
 * create their own admin accounts").
 *
 * Every function here throws user-facing Romanian messages, never a raw
 * Supabase/GoTrue error string — those come back in English and in
 * internal wording ("duplicate key value violates unique constraint...")
 * that means nothing to whoever reads it in the admin UI.
 */

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  active: boolean;
  last_login_at: string | null;
  created_at: string;
  roles: { key: string } | null;
}

function fromRow(row: UserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name ?? "",
    role: (row.roles?.key as AdminRole) ?? "HOTEL_ADMIN",
    active: row.active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  if (!isSupabaseConfigured()) return [];
  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("users")
    .select("id, email, full_name, active, last_login_at, created_at, roles(key)")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as UserRow[]).map(fromRow);
}

async function getRoleId(admin: NonNullable<ReturnType<typeof createAdminClient>>, role: AdminRole): Promise<string> {
  const { data, error } = await admin.from("roles").select("id").eq("key", role).single();
  if (error || !data) throw new Error(`Rolul ${role} nu există în baza de date.`);
  return data.id as string;
}

/** True for every shape Supabase/GoTrue uses to say "this email is already
 * registered" — varies by version (a `code` field on newer GoTrue, plain
 * message text on older ones), so check both. */
function isEmailAlreadyExistsError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code?.toLowerCase() ?? "";
  const msg = error.message?.toLowerCase() ?? "";
  return (
    code.includes("email_exists") ||
    code.includes("user_already_exists") ||
    msg.includes("already registered") ||
    msg.includes("already exists") ||
    msg.includes("already been registered")
  );
}

/** Translates the auth-account-creation errors this screen can actually
 * hit into Romanian. Duplicate email is handled separately by the caller
 * (it needs the existing user's id, not just a message), so this covers
 * everything else. */
function translateAuthError(error: { message?: string; code?: string } | null | undefined): string {
  const code = error?.code?.toLowerCase() ?? "";
  const msg = error?.message?.toLowerCase() ?? "";
  if (code.includes("invalid_email") || msg.includes("invalid") && msg.includes("email")) {
    return "Adresa de email nu este validă.";
  }
  if (code.includes("weak_password") || msg.includes("password")) {
    return "Parola generată nu a fost acceptată. Încearcă din nou.";
  }
  return "Crearea contului a eșuat. Încearcă din nou.";
}

/** Paginates through Supabase Auth users to find one by email — the admin
 * API has no direct "get by email" lookup that's stable across GoTrue
 * versions. Bounded to 1000 users, far more than an admin-only user base
 * will ever have. */
async function findAuthUserIdByEmail(admin: NonNullable<ReturnType<typeof createAdminClient>>, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

export type CreateAdminUserOutcome =
  | { kind: "created"; user: AdminUser }
  /** public.users already has a profile row for this email. */
  | { kind: "profile_exists" }
  /** A Supabase Auth account exists for this email, but no public.users
   * profile — the caller should offer to link it instead of erroring. */
  | { kind: "auth_exists_no_profile"; authUserId: string };

export async function createAdminUser(input: {
  email: string;
  fullName: string;
  password: string;
  role: AdminRole;
}): Promise<CreateAdminUserOutcome> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase nu este configurat.");

  const { data: existingProfile } = await admin.from("users").select("id").ilike("email", input.email).maybeSingle();
  if (existingProfile) return { kind: "profile_exists" };

  const roleId = await getRoleId(admin, input.role);

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (authError) {
    if (isEmailAlreadyExistsError(authError)) {
      const authUserId = await findAuthUserIdByEmail(admin, input.email);
      if (authUserId) return { kind: "auth_exists_no_profile", authUserId };
      throw new Error("Există deja un cont cu această adresă de email.");
    }
    throw new Error(translateAuthError(authError));
  }
  if (!authData.user) throw new Error("Crearea contului a eșuat. Încearcă din nou.");

  const { data, error } = await admin
    .from("users")
    .insert({ id: authData.user.id, email: input.email, full_name: input.fullName, role_id: roleId, active: true })
    .select("id, email, full_name, active, last_login_at, created_at, roles(key)")
    .single();
  if (error || !data) {
    // Roll back the orphaned Auth user so a failed profile insert doesn't
    // leave an unlisted, unmanageable Supabase Auth account behind.
    await admin.auth.admin.deleteUser(authData.user.id).catch(() => {});
    throw new Error("Salvarea profilului a eșuat. Încearcă din nou.");
  }
  return { kind: "created", user: fromRow(data as unknown as UserRow) };
}

/** Creates the missing public.users profile row for a Supabase Auth
 * account that already exists (see "auth_exists_no_profile" above) —
 * the Super Admin's way to recover an account that was created in Auth
 * but never got a matching profile (e.g. a previous failed attempt). */
export async function linkExistingAuthUser(input: {
  authUserId: string;
  email: string;
  fullName: string;
  role: AdminRole;
}): Promise<AdminUser> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase nu este configurat.");
  const roleId = await getRoleId(admin, input.role);
  const { data, error } = await admin
    .from("users")
    .insert({ id: input.authUserId, email: input.email, full_name: input.fullName, role_id: roleId, active: true })
    .select("id, email, full_name, active, last_login_at, created_at, roles(key)")
    .single();
  if (error || !data) throw new Error("Asocierea profilului a eșuat. Încearcă din nou.");
  return fromRow(data as unknown as UserRow);
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase nu este configurat.");
  const { error } = await admin.from("users").update({ active }).eq("id", id);
  if (error) throw new Error(active ? "Activarea contului a eșuat. Încearcă din nou." : "Dezactivarea contului a eșuat. Încearcă din nou.");
}

export async function changeUserRole(id: string, role: AdminRole): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase nu este configurat.");
  const roleId = await getRoleId(admin, role);
  const { error } = await admin.from("users").update({ role_id: roleId }).eq("id", id);
  if (error) throw new Error("Schimbarea rolului a eșuat. Încearcă din nou.");
}

/**
 * Generates a random temporary password and sets it directly via the
 * Supabase Auth admin API — returned once so the Super Admin can share it
 * with the user out-of-band (no email-based reset flow, matching this
 * app's "admin accounts are provisioned out-of-band" convention).
 */
export async function resetUserPassword(id: string): Promise<string> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase nu este configurat.");
  const tempPassword = randomBytes(9).toString("base64url");
  const { error } = await admin.auth.admin.updateUserById(id, { password: tempPassword });
  if (error) throw new Error("Resetarea parolei a eșuat. Încearcă din nou.");
  return tempPassword;
}

/** Called right after a successful admin sign-in (see api/admin/mark-login). */
export async function markLastLogin(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", userId);
}
