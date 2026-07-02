"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/admin/session";
import { saveModuleOverrides, saveBookingSettings } from "@/lib/data/settings";
import { updatePropertyContactInfo } from "@/lib/data/property";
import { MODULES, type ModuleKey } from "@/config/modules";

export async function toggleModuleAction(key: ModuleKey, enabled: boolean): Promise<void> {
  await assertAdminRole("owner", "manager");
  if (!MODULES.some((m) => m.key === key)) return;
  await saveModuleOverrides({ [key]: enabled });
  revalidatePath("/admin/settings");
}

const bookingSettingsSchema = z.object({
  touristTaxPerPersonPerNight: z.coerce.number().min(0).max(100),
  cancellationMinDaysBefore: z.coerce.number().int().min(0).max(60),
  cancellationPolicyRo: z.string().min(1),
  cancellationPolicyEn: z.string().min(1),
});

export interface BookingSettingsFormState {
  error?: string;
  saved?: boolean;
}

export async function saveBookingSettingsAction(
  _prev: BookingSettingsFormState,
  formData: FormData
): Promise<BookingSettingsFormState> {
  await assertAdminRole("owner", "manager");
  const parsed = bookingSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Verifică valorile introduse." };
  const data = parsed.data;
  try {
    await saveBookingSettings({
      touristTaxPerPersonPerNight: data.touristTaxPerPersonPerNight,
      cancellationMinDaysBefore: data.cancellationMinDaysBefore,
      cancellationPolicy: { ro: data.cancellationPolicyRo, en: data.cancellationPolicyEn },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Eroare la salvare." };
  }
  revalidatePath("/admin/settings");
  return { saved: true };
}

const propertyContactSchema = z.object({
  name: z.string().min(1, "Numele este obligatoriu"),
  email: z.string().email("Email invalid"),
  phone: z.string().min(5, "Telefon invalid"),
  whatsapp: z.string().min(5, "WhatsApp invalid").regex(/^\d+$/, "Doar cifre, fără + sau spații (ex: 40754417713)"),
  address: z.string().min(3, "Adresa este obligatorie"),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
});

export interface PropertyContactFormState {
  error?: string;
  saved?: boolean;
}

export async function savePropertyContactAction(
  _prev: PropertyContactFormState,
  formData: FormData
): Promise<PropertyContactFormState> {
  await assertAdminRole("owner", "manager");
  const parsed = propertyContactSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifică valorile introduse." };
  try {
    await updatePropertyContactInfo(parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Eroare la salvare." };
  }
  revalidatePath("/admin/settings");
  revalidatePath("/ro", "layout");
  revalidatePath("/en", "layout");
  return { saved: true };
}
