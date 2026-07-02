"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createService, updateService, deleteService } from "@/lib/data/services";
import { slugify } from "@/lib/utils";
import { assertAdminRole } from "@/lib/admin/session";
import type { ExtraService } from "@/lib/types";

const serviceSchema = z.object({
  id: z.string().optional(),
  nameRo: z.string().min(2, "Numele (RO) este obligatoriu"),
  nameEn: z.string().optional(),
  descriptionRo: z.string().optional(),
  descriptionEn: z.string().optional(),
  slug: z.string().optional(),
  price: z.coerce.number().min(0),
  chargeType: z.enum(["per_person", "per_room", "per_booking", "per_night"]),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  activeCheckbox: z.string().optional(),
});

export interface ServiceFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function saveServiceAction(_prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  await assertAdminRole("HOTEL_ADMIN");
  const raw = Object.fromEntries(formData.entries());
  const parsed = serviceSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifică datele introduse.", fieldErrors };
  }

  const data = parsed.data;
  const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.nameRo);

  const serviceData: Omit<ExtraService, "id"> = {
    slug,
    name: { ro: data.nameRo, en: data.nameEn?.trim() || data.nameRo },
    description: { ro: data.descriptionRo ?? "", en: data.descriptionEn?.trim() || data.descriptionRo || "" },
    price: data.price,
    chargeType: data.chargeType,
    availableFrom: data.availableFrom?.trim() || undefined,
    availableTo: data.availableTo?.trim() || undefined,
    active: data.activeCheckbox === "true",
  };

  try {
    if (data.id) {
      await updateService(data.id, serviceData);
    } else {
      await createService({ id: `svc-${slug}-${Date.now().toString(36)}`, ...serviceData });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "A apărut o eroare la salvare." };
  }

  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function deleteServiceAction(id: string): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  await deleteService(id);
  revalidatePath("/admin/services");
}
