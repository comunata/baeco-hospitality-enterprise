import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAttractions } from "@/lib/data/explore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { DeleteAttractionButton } from "../explore/DeleteAttractionButton";

export default async function AdminAttractionsPage() {
  const { dict } = await getServerDictionary();
  const attractions = await getAttractions();
  const items = attractions.filter((a) => a.category !== "restaurant" && a.category !== "cafe");

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.attractions}
        action={
          <Link href="/admin/attractions/new" className="rounded-sm bg-champagne px-4 py-2 text-sm font-medium text-midnight hover:opacity-90">
            + Atracție nouă
          </Link>
        }
      />
      <AdminTable
        emptyLabel="Nicio atracție adăugată."
        keyField={(a) => a.id}
        rows={items}
        columns={[
          { header: "Nume", render: (a) => a.name.ro },
          { header: "Categorie", render: (a) => <span className="capitalize">{a.category}</span> },
          { header: "Distanță", render: (a) => `${a.distanceKm} km / ${a.driveMinutes} min` },
          { header: "Potrivit pentru", render: (a) => a.goodFor.join(", ") || "—" },
          {
            header: "Acțiuni",
            render: (a) => (
              <div className="flex items-center gap-3">
                <Link href={`/admin/attractions/${a.id}/edit`} className="text-xs uppercase tracking-wider text-champagne hover:opacity-80">
                  Editează
                </Link>
                <DeleteAttractionButton id={a.id} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
