import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getPage } from "@/lib/data/pages";
import { seedFacilities } from "@/lib/data/seed/facilities";
import { ContentPageBody } from "@/components/pages/ContentPageBody";
import { Section } from "@/components/ui/Section";

export default async function FacilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const page = await getPage("facilities");
  if (!page) notFound();
  return (
    <>
      <ContentPageBody page={page} locale={locale} eyebrow={dict.nav.facilities} />
      <Section className="bg-graphite/40">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {seedFacilities.map((facility) => (
            <div key={facility.id}>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-champagne/30 text-xl text-champagne">
                {facility.icon}
              </div>
              <h3 className="font-display text-xl text-ivory">{facility.name[locale] ?? facility.name.en}</h3>
              <p className="mt-2 text-sm text-stone">{facility.description[locale] ?? facility.description.en}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
