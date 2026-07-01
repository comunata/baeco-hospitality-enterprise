import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { getPage } from "@/lib/data/pages";

const EDITABLE_SLUGS = ["restaurant", "spa", "pool", "facilities", "gallery"];

export default async function AdminPagesPage() {
  const pages = await Promise.all(
    EDITABLE_SLUGS.map(async (slug) => ({ slug, page: await getPage(slug) }))
  );

  return (
    <div>
      <AdminPageHeader
        title="Pagini de conținut (CMS)"
        description="Editează titlul, subtitlul, textul și galeria pentru secțiunile publice ale site-ului."
      />
      <AdminTable
        emptyLabel="Nicio pagină."
        keyField={(p) => p.slug}
        rows={pages}
        columns={[
          { header: "Pagină", render: (p) => p.page?.title.ro ?? p.slug },
          { header: "Slug", render: (p) => <span className="font-mono text-xs">{p.slug}</span> },
          { header: "Imagini galerie", render: (p) => String(p.page?.gallery.length ?? 0) },
          {
            header: "Acțiuni",
            render: (p) => (
              <Link href={`/admin/pages/${p.slug}`} className="text-xs uppercase tracking-wider text-champagne hover:opacity-80">
                Editează
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
