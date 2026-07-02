"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/admin/session";
import { updateGalleryImageMeta, setPrimaryGalleryImage, reorderGalleryImages, deleteGalleryImage } from "@/lib/data/gallery";

export interface GalleryActionState {
  error?: string;
}

const metaSchema = z.object({
  id: z.string().min(1),
  titleRo: z.string().max(200).optional(),
  titleEn: z.string().max(200).optional(),
  altRo: z.string().max(300).optional(),
  altEn: z.string().max(300).optional(),
});

export async function updateImageMetaAction(_prevState: GalleryActionState, formData: FormData): Promise<GalleryActionState> {
  await assertAdminRole("owner", "manager", "staff");
  const raw = Object.fromEntries(formData.entries());
  const parsed = metaSchema.safeParse(raw);
  if (!parsed.success) return { error: "Date invalide." };
  const data = parsed.data;

  try {
    await updateGalleryImageMeta(data.id, {
      title: { ro: data.titleRo ?? "", en: data.titleEn?.trim() || data.titleRo || "" },
      alt: { ro: data.altRo ?? "", en: data.altEn?.trim() || data.altRo || "" },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "A apărut o eroare la salvare." };
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/ro/gallery");
  revalidatePath("/en/gallery");
  return {};
}

export async function setPrimaryImageAction(id: string): Promise<void> {
  await assertAdminRole("owner", "manager", "staff");
  await setPrimaryGalleryImage(id);
  revalidatePath("/admin/gallery");
  revalidatePath("/ro/gallery");
  revalidatePath("/en/gallery");
}

export async function reorderImagesAction(orderedIds: string[]): Promise<void> {
  await assertAdminRole("owner", "manager", "staff");
  await reorderGalleryImages(orderedIds);
  revalidatePath("/admin/gallery");
  revalidatePath("/ro/gallery");
  revalidatePath("/en/gallery");
}

export async function deleteImageAction(id: string): Promise<void> {
  await assertAdminRole("owner", "manager");
  await deleteGalleryImage(id);
  revalidatePath("/admin/gallery");
  revalidatePath("/ro/gallery");
  revalidatePath("/en/gallery");
}
