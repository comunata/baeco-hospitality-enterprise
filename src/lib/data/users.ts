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

export async function createAdminUser(input: {
  email: string;
  fullName: string;
  password: string;
  role: AdminRole;
}): Promise<AdminUser> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase nu este configurat.");

  const roleId = await getRoleId(admin, input.role);

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (authError || !authData.user) throw new Error(authError?.message ?? "Crearea contului a eșuat.");

  const { data, error } = await admin
    .from("users")
    .insert({ id: authData.user.id, email: input.email, full_name: input.fullName, role_id: roleId, active: true })
    .select("id, email, full_name, active, last_login_at, created_at, roles(key)")
    .single();
  if (error || !data) {
    // Roll back the orphaned Auth user so a failed profile insert doesn't
    // leave an unlisted, unmanageable Supabase Auth account behind.
    await admin.auth.admin.deleteUser(authData.user.id).catch(() => {});
    throw new Error(error?.message ?? "Salvarea profilului a eșuat.");
  }
  return fromRow(data as unknown as UserRow);
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase nu este configurat.");
  const { error } = await admin.from("users").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function changeUserRole(id: string, role: AdminRole): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase nu este configurat.");
  const roleId = await getRoleId(admin, role);
  const { error } = await admin.from("users").update({ role_id: roleId }).eq("id", id);
  if (error) throw new Error(error.message);
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
  if (error) throw new Error(error.message);
  return tempPassword;
}

/** Called right after a successful admin sign-in (see api/admin/mark-login). */
export async function markLastLogin(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", userId);
}
