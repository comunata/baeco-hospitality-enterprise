"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSeason, updateSeason, deleteSeason } from "@/lib/data/seasons";
import { assertAdminRole } from "@/lib/admin/session";

const seasonSchema = z.object({
  id: z.string().optional(),
  nameRo: z.string().min(2, "Numele (RO) este obligatoriu"),
  nameEn: z.string().optional(),
  startDate: z.string().min(1, "Data de început este obligatorie"),
  endDate: z.string().min(1, "Data de sfârșit este obligatorie"),
  multiplier: z.coerce.number().min(0.1),
  weekendMultiplier: z.coerce.number().min(0.1),
  minNights: z.coerce.number().int().min(1),
});

export interface SeasonFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function saveSeasonAction(_prevState: SeasonFormState, formData: FormData): Promise<SeasonFormState> {
  await assertAdminRole("HOTEL_ADMIN");
  const raw = Object.fromEntries(formData.entries());
  const parsed = seasonSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifică datele introduse.", fieldErrors };
  }

  const data = parsed.data;
  if (new Date(data.endDate) < new Date(data.startDate)) {
    return { error: "Data de sfârșit trebuie să fie după data de început." };
  }

  const seasonData = {
    name: { ro: data.nameRo, en: data.nameEn?.trim() || data.nameRo },
    startDate: data.startDate,
    endDate: data.endDate,
    multiplier: data.multiplier,
    weekendMultiplier: data.weekendMultiplier,
    minNights: data.minNights,
  };

  try {
    if (data.id) {
      await updateSeason(data.id, seasonData);
    } else {
      await createSeason({ id: `season-${Date.now().toString(36)}`, ...seasonData });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "A apărut o eroare la salvare." };
  }

  revalidatePath("/admin/seasons");
  revalidatePath("/admin/rates");
  redirect("/admin/seasons");
}

export async function deleteSeasonAction(id: string): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  await deleteSeason(id);
  revalidatePath("/admin/seasons");
  revalidatePath("/admin/rates");
}
