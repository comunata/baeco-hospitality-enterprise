import { getServerDictionary } from "@/lib/i18n/server";
import { getAllBookings } from "@/lib/data/bookings";
import { getRooms } from "@/lib/data/rooms";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusSelect } from "./StatusSelect";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminBookingsPage() {
  const { dict } = await getServerDictionary();
  const [bookings, rooms] = await Promise.all([getAllBookings(), getRooms()]);
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name.ro ?? id;

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.bookings} description={`${bookings.length} rezervări în total.`} />
      <AdminTable
        emptyLabel="Nu există rezervări încă."
        keyField={(b) => b.id}
        rows={[...bookings].sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1))}
        columns={[
          { header: "Cod", render: (b) => (
            <span className="font-mono text-xs">
              {b.code}
              {b.groupCode && <span className="ml-1 rounded-full border border-champagne/30 px-1.5 text-[9px] uppercase text-champagne" title={`Grup ${b.groupCode}`}>grup</span>}
            </span>
          ) },
          { header: "Oaspete", render: (b) => `${b.guest.firstName} ${b.guest.lastName}` },
          { header: "Cameră", render: (b) => roomName(b.roomId) },
          { header: "Check-in", render: (b) => (
            <span>
              {formatDate(b.checkIn)}
              {b.checkedInAt && <span className="ml-1 rounded-full border border-emerald/40 px-1.5 text-[9px] uppercase text-emerald" title={`Check-in online: ${b.arrivalTime ?? ""}`}>online</span>}
            </span>
          ) },
          { header: "Check-out", render: (b) => formatDate(b.checkOut) },
          { header: "Sursă", render: (b) => <span className="capitalize">{b.source}</span> },
          { header: "Total", render: (b) => formatCurrency(b.totals.total, b.totals.currency) },
          { header: "Status", render: (b) => <StatusSelect code={b.code} status={b.status} /> },
        ]}
      />
    </div>
  );
}
