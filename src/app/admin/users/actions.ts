"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/admin/session";
import { createAdminUser, setUserActive, changeUserRole, resetUserPassword } from "@/lib/data/users";
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
    const user = await createAdminUser({ ...parsed.data, password: tempPassword });
    revalidatePath("/admin/users");
    return { createdPassword: tempPassword, createdEmail: user.email };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Crearea contului a eșuat." };
  }
}

export async function toggleUserActiveAction(id: string, active: boolean): Promise<void> {
  await assertAdminRole("SUPER_ADMIN");
  await setUserActive(id, active);
  revalidatePath("/admin/users");
}

export async function changeUserRoleAction(id: string, role: string): Promise<void> {
  await assertAdminRole("SUPER_ADMIN");
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) throw new Error("Rol invalid.");
  await changeUserRole(id, parsed.data as AdminRole);
  revalidatePath("/admin/users");
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
    return { error: err instanceof Error ? err.message : "Resetarea parolei a eșuat." };
  }
}
