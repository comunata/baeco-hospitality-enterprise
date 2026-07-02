"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/admin/session";
import { createAdminUser, linkExistingAuthUser, setUserActive, changeUserRole, resetUserPassword } from "@/lib/data/users";
import type { AdminRole } from "@/lib/admin/session";

const roleSchema = z.enum(["SUPER_ADMIN", "DEMO_ADMIN", "HOTEL_ADMIN"]);

const createUserSchema = z.object({
  email: z.string().email("Adresa de email nu este validă."),
  fullName: z.string().min(1, "Numele este obligatoriu."),
  role: roleSchema,
});

export interface CreateUserState {
  error?: string;
  /** Shown once after a successful create, since the password is never
   * stored/displayed again — Super Admin must copy it out immediately. */
  createdPassword?: string;
  createdEmail?: string;
  /** Set when this email already has a Supabase Auth account but no
   * public.users profile — the form offers to link it instead of erroring. */
  needsRelink?: { authUserId: string; email: string; fullName: string; role: AdminRole };
}

export async function createUserAction(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  // Only a Super Admin may provision new admin accounts (Demo or Hotel) —
  // this is also where the central DEMO_ADMIN write block in
  // assertAdminRole applies, so a Demo Admin can never create accounts.
  await assertAdminRole("SUPER_ADMIN");

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date invalide." };

  const tempPassword = randomBytes(9).toString("base64url");
  try {
    const outcome = await createAdminUser({ ...parsed.data, password: tempPassword });
    if (outcome.kind === "profile_exists") {
      return { error: "Există deja un cont cu această adresă de email." };
    }
    if (outcome.kind === "auth_exists_no_profile") {
      return {
        needsRelink: { authUserId: outcome.authUserId, email: parsed.data.email, fullName: parsed.data.fullName, role: parsed.data.role },
      };
    }
    revalidatePath("/admin/users");
    return { createdPassword: tempPassword, createdEmail: outcome.user.email };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Crearea contului a eșuat. Încearcă din nou." };
  }
}

export interface RelinkUserState {
  error?: string;
  linked?: boolean;
}

/** Recovers an email that already has a Supabase Auth account but no
 * public.users profile row (e.g. a previous create attempt that failed
 * after the Auth step) — creates the missing profile pointing at the
 * existing Auth account instead of trying to create a brand-new one. */
export async function relinkUserProfileAction(_prev: RelinkUserState, formData: FormData): Promise<RelinkUserState> {
  await assertAdminRole("SUPER_ADMIN");

  const authUserId = String(formData.get("authUserId") ?? "");
  const email = String(formData.get("email") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const roleParsed = roleSchema.safeParse(formData.get("role"));
  if (!authUserId || !email || !roleParsed.success) return { error: "Date invalide pentru asociere." };

  try {
    await linkExistingAuthUser({ authUserId, email, fullName, role: roleParsed.data });
    revalidatePath("/admin/users");
    return { linked: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Asocierea contului a eșuat. Încearcă din nou." };
  }
}

export interface UserActionState {
  error?: string;
}

export async function toggleUserActiveAction(id: string, active: boolean): Promise<UserActionState> {
  try {
    await assertAdminRole("SUPER_ADMIN");
    await setUserActive(id, active);
    revalidatePath("/admin/users");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Acțiunea a eșuat. Încearcă din nou." };
  }
}

export async function changeUserRoleAction(id: string, role: string): Promise<UserActionState> {
  try {
    await assertAdminRole("SUPER_ADMIN");
    const parsed = roleSchema.safeParse(role);
    if (!parsed.success) return { error: "Rol invalid." };
    await changeUserRole(id, parsed.data as AdminRole);
    revalidatePath("/admin/users");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Schimbarea rolului a eșuat. Încearcă din nou." };
  }
}

export interface ResetPasswordState {
  error?: string;
  password?: string;
}

export async function resetPasswordAction(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  await assertAdminRole("SUPER_ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Lipsește utilizatorul." };
  try {
    const password = await resetUserPassword(id);
    return { password };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Resetarea parolei a eșuat. Încearcă din nou." };
  }
}
