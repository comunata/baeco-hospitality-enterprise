import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getPage } from "@/lib/data/pages";
import { ContentPageBody } from "@/components/pages/ContentPageBody";

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const page = await getPage("gallery");
  if (!page) notFound();
  return <ContentPageBody page={page} locale={locale} eyebrow={dict.nav.gallery} />;
}
