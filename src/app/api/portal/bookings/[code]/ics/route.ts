import { NextRequest, NextResponse } from "next/server";
import { getBookingByCode } from "@/lib/data/bookings";
import { getRooms } from "@/lib/data/rooms";
import { generateBookingIcs } from "@/lib/integrations/calendar";
import { getPortalSession } from "@/lib/portal/session";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const booking = await getBookingByCode(code);
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Authorization: booking codes are guessable/enumerable, so — exactly like
  // the PATCH route and the portal detail page — we require the caller to be
  // an authenticated portal session whose email matches the booking's guest
  // email. Without this check any caller could download another guest's
  // calendar invite (name, dates, room) by code alone (IDOR).
  const session = await getPortalSession();
  if (!session.authenticated || session.email.toLowerCase() !== booking.guest.email.toLowerCase()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const rooms = await getRooms();
  const roomName = rooms.find((r) => r.id === booking.roomId)?.name.ro ?? "Cazare";
  const ics = generateBookingIcs(booking, roomName);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${booking.code}.ics"`,
    },
  });
}
