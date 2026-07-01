import type { Locale } from "@/lib/i18n/config";
import type { PageContent } from "@/lib/data/seed/pages";
import { PageHeader } from "@/components/pages/PageHeader";
import { GalleryGrid } from "@/components/pages/GalleryGrid";
import { Section } from "@/components/ui/Section";

export function ContentPageBody({ page, locale, eyebrow }: { page: PageContent; locale: Locale; eyebrow?: string }) {
  const title = page.title[locale] ?? page.title.en;
  const subtitle = page.subtitle[locale] ?? page.subtitle.en;
  const body = page.body[locale] ?? page.body.en;

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <Section>
        {body && <p className="mb-12 max-w-2xl text-base leading-relaxed text-stone">{body}</p>}
        <GalleryGrid images={page.gallery} alt={title} />
      </Section>
    </>
  );
}
