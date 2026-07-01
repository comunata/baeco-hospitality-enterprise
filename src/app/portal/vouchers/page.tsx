import { getServerDictionary } from "@/lib/i18n/server";
import { getAllVouchers } from "@/lib/data/promotions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PortalVouchersPage() {
  const { dict } = await getServerDictionary();
  const vouchers = await getAllVouchers();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-ivory">{dict.portal.vouchers}</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {vouchers.map((v) => (
          <div key={v.id} className="rounded-sm border border-champagne/30 bg-graphite p-6">
            <p className="font-mono text-lg text-champagne">{v.code}</p>
            <p className="mt-2 text-2xl font-display text-ivory">{formatCurrency(v.balance)}</p>
            <p className="mt-1 text-xs text-stone">din {formatCurrency(v.initialValue)} inițial · expiră {formatDate(v.expiresAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
