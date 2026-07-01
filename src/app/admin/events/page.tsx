import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { getLocalEvents } from "@/lib/data/explore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatDate } from "@/lib/utils";
import { DeleteEventButton } from "../explore/DeleteEventButton";

export default async function AdminEventsPage() {
  const { dict } = await getServerDictionary();
  const events = await getLocalEvents();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.events}
        action={
          <Link href="/admin/events/new" className="rounded-sm bg-champagne px-4 py-2 text-sm font-medium text-midnight hover:opacity-90">
            + Eveniment nou
          </Link>
        }
      />
      <AdminTable
        emptyLabel="Niciun eveniment programat."
        keyField={(e) => e.id}
        rows={events}
        columns={[
          { header: "Eveniment", render: (e) => e.name.ro },
          { header: "Data", render: (e) => formatDate(e.date) },
          { header: "Locație", render: (e) => e.location },
          {
            header: "Acțiuni",
            render: (e) => (
              <div className="flex items-center gap-3">
                <Link href={`/admin/events/${e.id}/edit`} className="text-xs uppercase tracking-wider text-champagne hover:opacity-80">
                  Editează
                </Link>
                <DeleteEventButton id={e.id} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
