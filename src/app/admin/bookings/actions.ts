"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/admin/session";
import { updateBookingStatus } from "@/lib/data/bookings";
import type { BookingStatus } from "@/lib/types";

const VALID_STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled", "completed"];

export async function setBookingStatusAction(code: string, status: BookingStatus): Promise<void> {
  await assertAdminRole("owner", "manager", "staff");
  if (!VALID_STATUSES.includes(status)) return;
  await updateBookingStatus(code, status);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
}
