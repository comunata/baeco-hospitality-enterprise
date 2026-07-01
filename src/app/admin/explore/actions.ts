"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAttraction, updateAttraction, deleteAttraction, createLocalEvent, updateLocalEvent, deleteLocalEvent } from "@/lib/data/explore";
import { assertAdminRole } from "@/lib/admin/session";
import type { Attraction, LocalEvent } from "@/lib/types";

const attractionSchema = z.object({
  id: z.string().optional(),
  nameRo: z.string().min(2, "Numele (RO) este obligatoriu"),
  nameEn: z.string().optional(),
  descriptionRo: z.string().optional(),
  descriptionEn: z.string().optional(),
  category: z.enum(["attraction", "restaurant", "cafe", "market", "shop", "producer"]),
  image: z.string().optional(),
  distanceKm: z.coerce.number().min(0),
  driveMinutes: z.coerce.number().min(0),
  tags: z.string().optional(),
  goodFor: z.array(z.enum(["family", "romantic", "rainy-day", "kids"])).optional(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  redirectTo: z.string(),
});

export interface AttractionFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function linesToArray(value?: string): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function saveAttractionAction(_prevState: AttractionFormState, formData: FormData): Promise<AttractionFormState> {
  await assertAdminRole("owner", "manager", "staff");
  const raw = {
    ...Object.fromEntries(formData.entries()),
    goodFor: formData.getAll("goodFor"),
  };
  const parsed = attractionSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifică datele introduse.", fieldErrors };
  }

  const data = parsed.data;
  const attractionData: Omit<Attraction, "id"> = {
    name: { ro: data.nameRo, en: data.nameEn?.trim() || data.nameRo },
    category: data.category,
    description: { ro: data.descriptionRo ?? "", en: data.descriptionEn?.trim() || data.descriptionRo || "" },
    image: data.image?.trim() || undefined,
    distanceKm: data.distanceKm,
    driveMinutes: data.driveMinutes,
    tags: linesToArray(data.tags),
    goodFor: data.goodFor ?? [],
    lat: data.lat,
    lng: data.lng,
  };

  try {
    if (data.id) {
      await updateAttraction(data.id, attractionData);
    } else {
      await createAttraction({ id: `attr-${Date.now().toString(36)}`, ...attractionData });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "A apărut o eroare la salvare." };
  }

  revalidatePath("/admin/explore");
  revalidatePath("/admin/attractions");
  revalidatePath("/admin/restaurants");
  redirect(data.redirectTo);
}

export async function deleteAttractionAction(id: string): Promise<void> {
  await assertAdminRole("owner", "manager", "staff");
  await deleteAttraction(id);
  revalidatePath("/admin/attractions");
  revalidatePath("/admin/restaurants");
  revalidatePath("/admin/explore");
}

const eventSchema = z.object({
  id: z.string().optional(),
  nameRo: z.string().min(2, "Numele (RO) este obligatoriu"),
  nameEn: z.string().optional(),
  descriptionRo: z.string().optional(),
  descriptionEn: z.string().optional(),
  date: z.string().min(1, "Data este obligatorie"),
  location: z.string().optional(),
});

export interface EventFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function saveEventAction(_prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  await assertAdminRole("owner", "manager", "staff");
  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifică datele introduse.", fieldErrors };
  }

  const data = parsed.data;
  const eventData: Omit<LocalEvent, "id"> = {
    name: { ro: data.nameRo, en: data.nameEn?.trim() || data.nameRo },
    description: { ro: data.descriptionRo ?? "", en: data.descriptionEn?.trim() || data.descriptionRo || "" },
    date: data.date,
    location: data.location?.trim() ?? "",
  };

  try {
    if (data.id) {
      await updateLocalEvent(data.id, eventData);
    } else {
      await createLocalEvent({ id: `event-${Date.now().toString(36)}`, ...eventData });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "A apărut o eroare la salvare." };
  }

  revalidatePath("/admin/events");
  revalidatePath("/admin/explore");
  redirect("/admin/events");
}

export async function deleteEventAction(id: string): Promise<void> {
  await assertAdminRole("owner", "manager", "staff");
  await deleteLocalEvent(id);
  revalidatePath("/admin/events");
  revalidatePath("/admin/explore");
}
