"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getPortalSession } from "@/lib/portal/session";
import { getBookingByCode, completeOnlineCheckIn } from "@/lib/data/bookings";

const checkInSchema = z.object({
  code: z.string().min(1),
  arrivalTime: z.string().min(1, "Ora sosirii este obligatorie"),
  notes: z.string().max(500).optional(),
});

export interface CheckInFormState {
  error?: string;
  done?: boolean;
}

/** Online check-in: only the authenticated guest owning the booking. */
export async function onlineCheckInAction(_prev: CheckInFormState, formData: FormData): Promise<CheckInFormState> {
  const session = await getPortalSession();
  if (!session.authenticated || !session.email) return { error: "unauthorized" };

  const parsed = checkInSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Completează ora estimată a sosirii." };
  const { code, arrivalTime, notes } = parsed.data;

  const booking = await getBookingByCode(code);
  if (!booking || booking.guest.email.toLowerCase() !== session.email.toLowerCase()) return { error: "unauthorized" };
  if (booking.status === "cancelled") return { error: "Rezervarea este anulată." };
  if (booking.checkedInAt) return { done: true };

  await completeOnlineCheckIn(code, { arrivalTime, notes });
  revalidatePath(`/portal/bookings/${code}`);
  return { done: true };
}
