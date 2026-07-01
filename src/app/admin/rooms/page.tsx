import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAllRoomsAdmin } from "@/lib/data/rooms";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { formatCurrency } from "@/lib/utils";
import { DeleteRoomButton } from "./DeleteRoomButton";

export default async function AdminRoomsPage() {
  const { dict } = await getServerDictionary();
  const rooms = await getAllRoomsAdmin();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.rooms}
        action={
          <Link href="/admin/rooms/new" className="rounded-sm bg-champagne px-4 py-2 text-sm font-medium text-midnight hover:opacity-90">
            + Cameră nouă
          </Link>
        }
      />
      <AdminTable
        emptyLabel="Nicio cameră configurată."
        keyField={(r) => r.id}
        rows={rooms}
        columns={[
          { header: "Nume", render: (r) => r.name.ro },
          { header: "Capacitate", render: (r) => `${r.maxAdults} + ${r.maxChildren}` },
          { header: "Suprafață", render: (r) => `${r.sizeSqm} m²` },
          { header: "Preț de bază", render: (r) => formatCurrency(r.basePrice) },
          { header: "Status", render: (r) => <StatusBadge status={r.active ? "active" : "inactive"} /> },
          {
            header: "Acțiuni",
            render: (r) => (
              <div className="flex items-center gap-3">
                <Link href={`/admin/rooms/${r.id}/edit`} className="text-xs uppercase tracking-wider text-champagne hover:opacity-80">
                  Editează
                </Link>
                {r.active && <DeleteRoomButton id={r.id} />}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
