import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { getPage } from "@/lib/data/pages";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import Image from "next/image";

export default async function AdminGalleryPage() {
  const { dict } = await getServerDictionary();
  const page = await getPage("gallery");

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.gallery}
        description="Adaugă/elimină/reordonează imagini din Pagini (CMS) → Galerie. Pentru upload direct de fișiere e nevoie de Supabase Storage (neconfigurat încă) — momentan galeria se editează prin URL-uri de imagini."
        action={
          <Link href="/admin/pages/gallery" className="rounded-sm bg-champagne px-4 py-2 text-sm font-medium text-midnight hover:opacity-90">
            Editează galeria
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {page?.gallery.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-sm border border-platinum/10">
            <Image src={src} alt={`Gallery ${i + 1}`} fill sizes="25vw" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
