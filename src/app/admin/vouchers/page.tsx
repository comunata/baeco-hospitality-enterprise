import { getServerDictionary } from "@/lib/i18n/server";
import { getAllVouchers } from "@/lib/data/promotions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminVouchersPage() {
  const { dict } = await getServerDictionary();
  const vouchers = await getAllVouchers();

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.vouchers} />
      <AdminTable
        emptyLabel="Niciun voucher emis."
        keyField={(v) => v.id}
        rows={vouchers}
        columns={[
          { header: "Cod", render: (v) => <span className="font-mono">{v.code}</span> },
          { header: "Valoare inițială", render: (v) => formatCurrency(v.initialValue) },
          { header: "Sold rămas", render: (v) => formatCurrency(v.balance) },
          { header: "Expiră", render: (v) => formatDate(v.expiresAt) },
          { header: "Status", render: (v) => <StatusBadge status={v.active ? "active" : "inactive"} /> },
        ]}
      />
    </div>
  );
}
