import { getServerDictionary } from "@/lib/i18n/server";
import { getIntegrationStatuses } from "@/lib/integrations/status";
import { requireAdminRole } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/AdminTable";

export default async function AdminIntegrationsPage() {
  // Owner-only: this page lists which integrations are configured, which is
  // sensitive operational detail (though not the secret values themselves).
  await requireAdminRole("owner");
  const { dict } = await getServerDictionary();
  const statuses = getIntegrationStatuses();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.integrations}
        description="Fiecare integrare rulează în mod mock/sandbox până când setezi variabilele de mediu corespunzătoare — nimic nu se blochează în lipsa cheilor."
      />
      <div className="space-y-3">
        {statuses.map((status) => (
          <div key={status.key} className="flex flex-col justify-between gap-2 rounded-sm border border-platinum/10 bg-graphite/60 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-lg text-ivory">{status.label}</p>
              <p className="mt-1 text-xs text-stone">{status.envVars.join(", ")}</p>
            </div>
            <StatusBadge status={status.configured ? "active" : "inactive"} />
          </div>
        ))}
      </div>
    </div>
  );
}
