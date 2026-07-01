import { getServerDictionary } from "@/lib/i18n/server";
import { getAllBookings } from "@/lib/data/bookings";
import { getRooms } from "@/lib/data/rooms";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
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
          { header: "Cod", render: (b) => <span className="font-mono text-xs">{b.code}</span> },
          { header: "Oaspete", render: (b) => `${b.guest.firstName} ${b.guest.lastName}` },
          { header: "Cameră", render: (b) => roomName(b.roomId) },
          { header: "Check-in", render: (b) => formatDate(b.checkIn) },
          { header: "Check-out", render: (b) => formatDate(b.checkOut) },
          { header: "Sursă", render: (b) => <span className="capitalize">{b.source}</span> },
          { header: "Total", render: (b) => formatCurrency(b.totals.total, b.totals.currency) },
          { header: "Status", render: (b) => <StatusBadge status={b.status} /> },
        ]}
      />
    </div>
  );
}
