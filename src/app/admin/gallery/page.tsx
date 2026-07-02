import { getServerDictionary } from "@/lib/i18n/server";
import { getMediaItems } from "@/lib/data/media";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MediaManager } from "@/components/admin/media/MediaManager";

export default async function AdminGalleryPage() {
  const { dict } = await getServerDictionary();
  const images = await getMediaItems("gallery");

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.gallery}
        description="Trage imagini sau alege fișiere pentru upload — sunt optimizate și convertite automat în WebP. Trage un card pentru a reordona, click pe o imagine pentru titlu/ALT, iar steaua marchează imaginea principală."
      />
      <MediaManager ownerType="gallery" initialImages={images} />
    </div>
  );
}
