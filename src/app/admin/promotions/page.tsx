import { getServerDictionary } from "@/lib/i18n/server";
import { getAllPromotions } from "@/lib/data/promotions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { formatDate } from "@/lib/utils";

export default async function AdminPromotionsPage() {
  const { dict } = await getServerDictionary();
  const promotions = await getAllPromotions();

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.promotions} />
      <AdminTable
        emptyLabel="Niciun cod promoțional."
        keyField={(p) => p.id}
        rows={promotions}
        columns={[
          { header: "Cod", render: (p) => <span className="font-mono">{p.code}</span> },
          { header: "Tip", render: (p) => (p.type === "percentage" ? `${p.value}%` : `${p.value} EUR`) },
          { header: "Valabilitate", render: (p) => `${formatDate(p.validFrom)} – ${formatDate(p.validTo)}` },
          { header: "Utilizări", render: (p) => `${p.redemptions}${p.maxRedemptions ? ` / ${p.maxRedemptions}` : ""}` },
          { header: "Status", render: (p) => <StatusBadge status={p.active ? "active" : "inactive"} /> },
        ]}
      />
    </div>
  );
}
