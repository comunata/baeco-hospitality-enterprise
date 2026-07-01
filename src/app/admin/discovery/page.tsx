import { requireAdminRole } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { getPropertyProfile, listPlaces, listScans } from "@/lib/data/discovery";
import { CATEGORY_LABELS, type BdCategory, type DiscoveredPlace } from "@/lib/discovery/types";
import { formatDate } from "@/lib/utils";
import { PropertyForm } from "./PropertyForm";
import { ScanPanel } from "./ScanPanel";
import { PlaceRowActions } from "./PlaceRow";
import { ApproveCategoryButton } from "./ApproveCategoryButton";

const statusLabel: Record<DiscoveredPlace["status"], { label: string; className: string }> = {
  pending: { label: "În așteptare", className: "border-amber-300/40 text-amber-200" },
  approved: { label: "Aprobat", className: "border-emerald/40 text-emerald" },
  rejected: { label: "Respins", className: "border-red-400/40 text-red-300" },
};

export default async function AdminDiscoveryPage() {
  await requireAdminRole("owner", "manager", "staff");

  const [profile, places, scans] = await Promise.all([getPropertyProfile(), listPlaces(), listScans(5)]);

  const pending = places.filter((p) => p.status === "pending");
  const approved = places.filter((p) => p.status === "approved");
  const rejected = places.filter((p) => p.status === "rejected");

  const byCategory = new Map<BdCategory, DiscoveredPlace[]>();
  for (const place of places) {
    const list = byCategory.get(place.category) ?? [];
    list.push(place);
    byCategory.set(place.category, list);
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader title="AI Discovery — Hospitality Intelligence Engine" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Locuri descoperite" value={String(places.length)} />
        <StatCard label="În așteptare" value={String(pending.length)} />
        <StatCard label="Aprobate" value={String(approved.length)} />
        <StatCard label="Respinse" value={String(rejected.length)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PropertyForm profile={profile} />
        <div className="space-y-4">
          <ScanPanel defaultRadiusKm={profile.discoveryRadiusKm} />
          {scans.length > 0 && (
            <div className="rounded-sm border border-platinum/10 bg-graphite/40 p-4">
              <p className="text-[11px] uppercase tracking-wider text-stone">Istoric scanări</p>
              <ul className="mt-2 space-y-1.5 text-xs text-stone">
                {scans.map((scan) => (
                  <li key={scan.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {formatDate(scan.createdAt)} · {scan.radiusKm} km · {scan.foundCount} găsite / <span className="text-champagne">{scan.newCount} noi</span>
                    </span>
                    <span className={scan.status === "failed" ? "text-red-300" : "text-emerald"}>{scan.message ?? scan.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {places.length === 0 ? (
        <div className="rounded-sm border border-platinum/10 bg-graphite/40 p-10 text-center text-sm text-stone">
          Niciun loc descoperit încă. Salvează profilul proprietății și pornește prima scanare.
        </div>
      ) : (
        Array.from(byCategory.entries()).map(([category, items]) => {
          const pendingCount = items.filter((p) => p.status === "pending").length;
          return (
            <section key={category}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl text-ivory">
                  {CATEGORY_LABELS[category].ro} <span className="text-sm text-stone">({items.length})</span>
                </h2>
                <ApproveCategoryButton category={category} count={pendingCount} />
              </div>
              <div className="overflow-x-auto rounded-sm border border-platinum/10">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-graphite/60 text-[11px] uppercase tracking-wider text-stone">
                    <tr>
                      <th className="px-4 py-3">Nume</th>
                      <th className="px-4 py-3">Distanță</th>
                      <th className="px-4 py-3">Scor</th>
                      <th className="px-4 py-3">Detalii</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-platinum/10">
                    {items.map((place) => (
                      <tr key={place.id} className="align-top">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ivory">
                            {place.pinned && <span title="Fixat în top" className="mr-1 text-champagne">★</span>}
                            {place.name}
                          </p>
                          {place.subcategory && <p className="text-xs text-stone">{place.subcategory}</p>}
                          <a href={`https://www.google.com/maps?q=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" className="text-[11px] uppercase tracking-wider text-champagne underline">
                            Hartă
                          </a>
                        </td>
                        <td className="px-4 py-3 text-stone">{place.distanceKm} km · {place.driveMinutes} min</td>
                        <td className="px-4 py-3">
                          <span className={place.qualityScore >= 60 ? "text-emerald" : place.qualityScore >= 35 ? "text-amber-200" : "text-stone"}>{place.qualityScore}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone">
                          {[place.openingHours, place.phone, place.website ? "website" : undefined].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${statusLabel[place.status].className}`}>
                            {statusLabel[place.status].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <PlaceRowActions place={place} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
