import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal/session";

/** The Portal Client has no accounts — a session is always scoped to
 * exactly one booking, so "my bookings" is just that one booking's page. */
export default async function PortalBookingsPage() {
  const session = await getPortalSession();
  redirect(session.bookingCode ? `/portal/bookings/${session.bookingCode}` : "/portal");
}
