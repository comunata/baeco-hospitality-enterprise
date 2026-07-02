"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/admin/session";
import { saveModuleOverrides, saveBookingSettings } from "@/lib/data/settings";
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
