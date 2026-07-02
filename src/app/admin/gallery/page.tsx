import { getServerDictionary } from "@/lib/i18n/server";
import { getGalleryImages } from "@/lib/data/gallery";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GalleryManager } from "./GalleryManager";

export default async function AdminGalleryPage() {
  const { dict } = await getServerDictionary();
  const images = await getGalleryImages();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.gallery}
        description="Trage imagini sau alege fișiere pentru upload — sunt optimizate și convertite automat în WebP. Trage un card pentru a reordona, click pe o imagine pentru titlu/ALT, iar steaua marchează imaginea principală."
      />
      <GalleryManager initialImages={images} />
    </div>
  );
}
