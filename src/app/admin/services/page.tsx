import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAllServicesAdmin } from "@/lib/data/services";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { formatCurrency } from "@/lib/utils";
import { DeleteServiceButton } from "./DeleteServiceButton";

const chargeTypeLabel: Record<string, string> = {
  per_person: "per persoană",
  per_room: "per cameră",
  per_booking: "per rezervare",
  per_night: "per noapte",
};

export default async function AdminServicesPage() {
  const { dict } = await getServerDictionary();
  const services = await getAllServicesAdmin();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.services}
        action={
          <Link href="/admin/services/new" className="rounded-sm bg-champagne px-4 py-2 text-sm font-medium text-midnight hover:opacity-90">
            + Serviciu nou
          </Link>
        }
      />
      <AdminTable
        emptyLabel="Niciun serviciu configurat."
        keyField={(s) => s.id}
        rows={services}
        columns={[
          { header: "Serviciu", render: (s) => s.name.ro },
          { header: "Preț", render: (s) => formatCurrency(s.price) },
          { header: "Taxare", render: (s) => chargeTypeLabel[s.chargeType] },
          { header: "Status", render: (s) => <StatusBadge status={s.active ? "active" : "inactive"} /> },
          {
            header: "Acțiuni",
            render: (s) => (
              <div className="flex items-center gap-3">
                <Link href={`/admin/services/${s.id}/edit`} className="text-xs uppercase tracking-wider text-champagne hover:opacity-80">
                  Editează
                </Link>
                {s.active && <DeleteServiceButton id={s.id} />}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
