"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRoom, updateRoom, deleteRoom, getRoomById } from "@/lib/data/rooms";
import { slugify } from "@/lib/utils";
import { assertAdminRole } from "@/lib/admin/session";
import type { Room } from "@/lib/types";

const roomSchema = z.object({
  id: z.string().optional(),
  nameRo: z.string().min(2, "Numele (RO) este obligatoriu"),
  nameEn: z.string().optional(),
  descriptionRo: z.string().optional(),
  descriptionEn: z.string().optional(),
  slug: z.string().optional(),
  maxAdults: z.coerce.number().int().min(1),
  maxChildren: z.coerce.number().int().min(0),
  sizeSqm: z.coerce.number().min(0),
  basePrice: z.coerce.number().min(0),
  beds: z.string().optional(),
  amenities: z.string().optional(),
  gallery: z.string().optional(),
  coverImage: z.string().optional(),
  virtualTourUrl: z.string().optional(),
  rulesRo: z.string().optional(),
  rulesEn: z.string().optional(),
  activeCheckbox: z.string().optional(),
});

export interface RoomFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function linesToArray(value?: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveRoomAction(_prevState: RoomFormState, formData: FormData): Promise<RoomFormState> {
  await assertAdminRole("owner", "manager", "staff");
  const raw = Object.fromEntries(formData.entries());
  const parsed = roomSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: "Verifică datele introduse.", fieldErrors };
  }

  const data = parsed.data;
  const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.nameRo);

  const roomData: Omit<Room, "id"> = {
    slug,
    name: { ro: data.nameRo, en: data.nameEn?.trim() || data.nameRo },
    description: { ro: data.descriptionRo ?? "", en: data.descriptionEn?.trim() || data.descriptionRo || "" },
    gallery: linesToArray(data.gallery),
    coverImage: data.coverImage?.trim() || linesToArray(data.gallery)[0] || "",
    maxAdults: data.maxAdults,
    maxChildren: data.maxChildren,
    sizeSqm: data.sizeSqm,
    beds: linesToArray(data.beds),
    amenities: linesToArray(data.amenities),
    basePrice: data.basePrice,
    rules: { ro: data.rulesRo ?? "", en: data.rulesEn?.trim() || data.rulesRo || "" },
    includedServiceIds: [],
    extraServiceIds: [],
    virtualTourUrl: data.virtualTourUrl?.trim() || undefined,
    active: data.activeCheckbox === "true",
  };

  try {
    if (data.id) {
      const existing = await getRoomById(data.id);
      await updateRoom(data.id, {
        ...roomData,
        includedServiceIds: existing?.includedServiceIds ?? [],
        extraServiceIds: existing?.extraServiceIds ?? [],
      });
    } else {
      await createRoom({ id: `room-${slug}-${Date.now().toString(36)}`, ...roomData });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "A apărut o eroare la salvare." };
  }

  revalidatePath("/admin/rooms");
  redirect("/admin/rooms");
}

export async function deleteRoomAction(id: string): Promise<void> {
  await assertAdminRole("owner", "manager");
  await deleteRoom(id);
  revalidatePath("/admin/rooms");
}
