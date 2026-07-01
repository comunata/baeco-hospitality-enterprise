import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAttractions } from "@/lib/data/explore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { DeleteAttractionButton } from "../explore/DeleteAttractionButton";

export default async function AdminRestaurantsPage() {
  const { dict } = await getServerDictionary();
  const attractions = await getAttractions();
  const restaurants = attractions.filter((a) => a.category === "restaurant" || a.category === "cafe");

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.restaurants}
        description="NOTĂ: constrângerea DB pentru attractions.category (schema Supabase) nu include încă 'restaurant'/'cafe' — vezi comentariul din lib/data/explore.ts. Funcționează integral pe fallback in-memory / seed."
        action={
          <Link href="/admin/restaurants/new" className="rounded-sm bg-champagne px-4 py-2 text-sm font-medium text-midnight hover:opacity-90">
            + Restaurant nou
          </Link>
        }
      />
      <AdminTable
        emptyLabel="Niciun restaurant/cafenea adăugat."
        keyField={(r) => r.id}
        rows={restaurants}
        columns={[
          { header: "Nume", render: (r) => r.name.ro },
          { header: "Categorie", render: (r) => <span className="capitalize">{r.category}</span> },
          { header: "Distanță", render: (r) => `${r.distanceKm} km / ${r.driveMinutes} min` },
          { header: "Potrivit pentru", render: (r) => r.goodFor.join(", ") },
          {
            header: "Acțiuni",
            render: (r) => (
              <div className="flex items-center gap-3">
                <Link href={`/admin/restaurants/${r.id}/edit`} className="text-xs uppercase tracking-wider text-champagne hover:opacity-80">
                  Editează
                </Link>
                <DeleteAttractionButton id={r.id} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
