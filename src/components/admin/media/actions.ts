"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/admin/session";
import { updateMediaItemMeta, setPrimaryMediaItem, reorderMediaItems, deleteMediaItem, type MediaOwnerType } from "@/lib/data/media";
import { getRoomById } from "@/lib/data/rooms";

export interface MediaActionState {
  error?: string;
}

/** Revalidates whatever page(s) actually read this owner's images —
 * admin list/edit screens, and the public pages synced via lib/data/media
 * (see syncLegacyOwner). */
async function revalidateOwner(ownerType: MediaOwnerType, ownerId: string | null): Promise<void> {
  if (ownerType === "gallery") {
    revalidatePath("/admin/gallery");
    revalidatePath("/ro/gallery");
    revalidatePath("/en/gallery");
    return;
  }
  if (ownerType === "room" && ownerId) {
    revalidatePath("/admin/rooms");
    revalidatePath(`/admin/rooms/${ownerId}/edit`);
    revalidatePath("/ro/rooms");
    revalidatePath("/en/rooms");
    revalidatePath("/ro");
    revalidatePath("/en");
    const room = await getRoomById(ownerId);
    if (room) {
      revalidatePath(`/ro/rooms/${room.slug}`);
      revalidatePath(`/en/rooms/${room.slug}`);
    }
  }
}

const metaSchema = z.object({
  id: z.string().min(1),
  ownerType: z.enum(["gallery", "room"]),
  ownerId: z.string().optional(),
  titleRo: z.string().max(200).optional(),
  titleEn: z.string().max(200).optional(),
  altRo: z.string().max(300).optional(),
  altEn: z.string().max(300).optional(),
});

export async function updateMediaMetaAction(_prevState: MediaActionState, formData: FormData): Promise<MediaActionState> {
  await assertAdminRole("owner", "manager", "staff");
  const raw = Object.fromEntries(formData.entries());
  const parsed = metaSchema.safeParse(raw);
  if (!parsed.success) return { error: "Date invalide." };
  const data = parsed.data;

  try {
    await updateMediaItemMeta(data.id, {
      title: { ro: data.titleRo ?? "", en: data.titleEn?.trim() || data.titleRo || "" },
      alt: { ro: data.altRo ?? "", en: data.altEn?.trim() || data.altRo || "" },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "A apărut o eroare la salvare." };
  }

  await revalidateOwner(data.ownerType, data.ownerId ?? null);
  return {};
}

export async function setPrimaryMediaAction(ownerType: MediaOwnerType, ownerId: string | null, id: string): Promise<void> {
  await assertAdminRole("owner", "manager", "staff");
  await setPrimaryMediaItem(ownerType, ownerId, id);
  await revalidateOwner(ownerType, ownerId);
}

export async function reorderMediaAction(ownerType: MediaOwnerType, ownerId: string | null, orderedIds: string[]): Promise<void> {
  await assertAdminRole("owner", "manager", "staff");
  await reorderMediaItems(ownerType, ownerId, orderedIds);
  await revalidateOwner(ownerType, ownerId);
}

export async function deleteMediaAction(ownerType: MediaOwnerType, ownerId: string | null, id: string): Promise<void> {
  await assertAdminRole("owner", "manager");
  await deleteMediaItem(ownerType, ownerId, id);
  await revalidateOwner(ownerType, ownerId);
}
