import { getServerDictionary } from "@/lib/i18n/server";
import { MODULES, moduleFlags } from "@/config/modules";
import { requireAdminRole } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/AdminTable";
import { siteConfig } from "@/config/site";

export default async function AdminSettingsPage() {
  await requireAdminRole("owner", "manager");
  const { dict } = await getServerDictionary();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.settings}
        description="Fiecare modul poate fi activat/dezactivat din variabile de mediu (NEXT_PUBLIC_MODULE_<CHEIE>=false). Persistență în Supabase (tabelul settings) — conectează-l pentru control din UI, fără redeploy."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MODULES.map((mod) => (
          <div key={mod.key} className="flex items-start justify-between rounded-sm border border-platinum/10 bg-graphite/60 p-5">
            <div>
              <p className="font-display text-lg text-ivory">{mod.label}</p>
              <p className="mt-1 text-sm text-stone">{mod.description}</p>
            </div>
            <StatusBadge status={moduleFlags[mod.key] ? "active" : "inactive"} />
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-sm border border-platinum/10 bg-graphite/60 p-6 text-sm text-stone">
        <p className="text-ivory">Proprietate: {siteConfig.name}</p>
        <p className="mt-1">Check-in {siteConfig.checkIn} · Check-out {siteConfig.checkOut} · Monedă {siteConfig.currency}</p>
      </div>
    </div>
  );
}
