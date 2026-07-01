import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { getPortalSession } from "@/lib/portal/session";
import { getBookingsForGuestEmail } from "@/lib/data/bookings";
import { getRooms } from "@/lib/data/rooms";
import { StatusBadge } from "@/components/admin/AdminTable";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PortalBookingsPage() {
  const { dict } = await getServerDictionary();
  const session = await getPortalSession();
  const [bookings, rooms] = await Promise.all([getBookingsForGuestEmail(session.email), getRooms()]);
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name.ro ?? id;

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">{dict.portal.myBookings}</h1>
      <div className="mt-8 space-y-4">
        {bookings.length === 0 && <p className="text-sm text-stone">Nu ai nicio rezervare încă.</p>}
        {bookings.map((b) => (
          <Link
            key={b.id}
            href={`/portal/bookings/${b.code}`}
            className="flex flex-col justify-between gap-3 rounded-sm border border-platinum/10 bg-graphite/60 p-6 transition-colors hover:border-champagne/40 sm:flex-row sm:items-center"
          >
            <div>
              <p className="font-display text-xl text-ivory">{roomName(b.roomId)}</p>
              <p className="mt-1 text-sm text-stone">
                {formatDate(b.checkIn)} – {formatDate(b.checkOut)} · {b.code}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-display text-lg text-champagne">{formatCurrency(b.totals.total, b.totals.currency)}</span>
              <StatusBadge status={b.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
