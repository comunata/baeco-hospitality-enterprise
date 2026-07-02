"use server";

import { revalidatePath } from "next/cache";
import { setRoomRateOverride } from "@/lib/data/seasons";
import { assertAdminRole } from "@/lib/admin/session";

export async function setRateOverrideAction(formData: FormData): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  const roomId = String(formData.get("roomId"));
  const seasonId = String(formData.get("seasonId"));
  const raw = String(formData.get("overridePrice") ?? "").trim();
  const overridePrice = raw === "" ? null : Number(raw);

  await setRoomRateOverride(roomId, seasonId, overridePrice !== null && Number.isFinite(overridePrice) ? overridePrice : null);
  revalidatePath("/admin/rates");
}
