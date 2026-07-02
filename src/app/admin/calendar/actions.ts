"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createRoomBlock, deleteRoomBlock } from "@/lib/data/availability";
import { assertAdminRole } from "@/lib/admin/session";

const blockSchema = z.object({
  roomId: z.string().min(1, "Selectează o cameră"),
  startDate: z.string().min(1, "Data de început este obligatorie"),
  endDate: z.string().min(1, "Data de sfârșit este obligatorie"),
  reason: z.string().optional(),
});

export interface BlockFormState {
  error?: string;
}

export async function createRoomBlockAction(_prevState: BlockFormState, formData: FormData): Promise<BlockFormState> {
  await assertAdminRole("HOTEL_ADMIN");
  const raw = Object.fromEntries(formData.entries());
  const parsed = blockSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide." };
  }
  const data = parsed.data;
  if (new Date(data.endDate) <= new Date(data.startDate)) {
    return { error: "Data de sfârșit trebuie să fie după data de început." };
  }

  try {
    await createRoomBlock({ roomId: data.roomId, startDate: data.startDate, endDate: data.endDate, reason: data.reason?.trim() || undefined });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "A apărut o eroare." };
  }

  revalidatePath("/admin/calendar");
  return {};
}

export async function deleteRoomBlockAction(id: string): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  await deleteRoomBlock(id);
  revalidatePath("/admin/calendar");
}
