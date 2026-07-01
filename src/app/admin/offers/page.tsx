import { getServerDictionary } from "@/lib/i18n/server";
import { getOffers } from "@/lib/data/content";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { formatDate } from "@/lib/utils";

export default async function AdminOffersPage() {
  const { dict } = await getServerDictionary();
  const offers = await getOffers();

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.offers} />
      <AdminTable
        emptyLabel="Nicio ofertă activă."
        keyField={(o) => o.id}
        rows={offers}
        columns={[
          { header: "Ofertă", render: (o) => o.title.ro },
          { header: "Reducere", render: (o) => (o.discountPercent ? `${o.discountPercent}%` : "—") },
          { header: "Valabilitate", render: (o) => `${formatDate(o.validFrom)} – ${formatDate(o.validTo)}` },
          { header: "Status", render: (o) => <StatusBadge status={o.active ? "active" : "inactive"} /> },
        ]}
      />
    </div>
  );
}
