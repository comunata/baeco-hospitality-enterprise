import { notFound } from "next/navigation";
import Image from "next/image";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getAttractions } from "@/lib/data/explore";
import { getWeatherToday } from "@/lib/integrations/weather";
import { PageHeader } from "@/components/pages/PageHeader";
import { Section } from "@/components/ui/Section";
import { LocalGuideChat } from "@/components/ai/LocalGuideChat";
import { DestinationExpertPanel } from "@/components/ai/DestinationExpertPanel";
import type { Attraction } from "@/lib/types";

// Real Bucovina photos (monasteries, nature, trails) categorized under
// public/images/explore — reused deterministically across attraction cards
// since there isn't a 1:1 photo per attraction in the seed data.
const exploreImages = [
  "/images/explore/voronet.webp",
  "/images/explore/sucevita.webp",
  "/images/explore/alpine-valley.webp",
  "/images/explore/alpine-lake.webp",
  "/images/explore/train-panorama.webp",
  "/images/explore/alpine-farm.webp",
  "/images/explore/cheese-cellar.webp",
  "/images/explore/bicaz-lake.webp",
  "/images/explore/cabin-lake.webp",
  "/images/explore/forest-stream.webp",
  "/images/explore/village-river.webp",
];

function imageFor(attraction: Attraction, index: number) {
  if (attraction.image) return attraction.image;
  return exploreImages[index % exploreImages.length];
}

const categoryLabel: Record<Attraction["category"], { ro: string; en: string }> = {
  attraction: { ro: "Obiective turistice", en: "Attractions" },
  restaurant: { ro: "Restaurante", en: "Restaurants" },
  cafe: { ro: "Cafenele", en: "Cafes" },
  market: { ro: "Piețe", en: "Markets" },
  shop: { ro: "Magazine locale", en: "Local shops" },
  producer: { ro: "Producători locali", en: "Local producers" },
};

export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const [attractions, weather] = await Promise.all([getAttractions(), getWeatherToday()]);

  const byCategory = attractions.reduce<Record<string, Attraction[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  return (
    <>
      <PageHeader eyebrow={dict.nav.explore} title={dict.explore.title} subtitle={dict.explore.subtitle} />
      <Section>
        <div className="mb-12 flex items-center gap-4 rounded-sm border border-platinum/10 bg-graphite/60 px-6 py-4">
          <span className="font-display text-3xl text-champagne">{weather.tempC}°C</span>
          <span className="text-sm text-stone">{dict.explore.weather} · {weather.condition}</span>
        </div>

        <div className="mb-10">
          <DestinationExpertPanel locale={locale} />
        </div>

        <div className="mb-16">
          <LocalGuideChat locale={locale} dict={dict} />
        </div>

        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category} className="mb-16">
            <h2 className="font-display text-2xl text-ivory">{categoryLabel[category as Attraction["category"]][locale === "ro" ? "ro" : "en"]}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {items.map((item, i) => (
                <div key={item.id} className="overflow-hidden rounded-sm border border-platinum/10 pb-6">
                  <div className="relative aspect-[16/9]">
                    <Image src={imageFor(item, i)} alt={item.name[locale] ?? item.name.en} fill sizes="50vw" className="object-cover" />
                  </div>
                  <div className="px-1 pt-4">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-lg text-ivory">{item.name[locale] ?? item.name.en}</h3>
                      <span className="text-xs uppercase tracking-widest text-champagne">
                        {item.distanceKm} km · {item.driveMinutes} min
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone">{item.description[locale] ?? item.description.en}</p>
                    <a
                      href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-xs font-medium uppercase tracking-widest text-champagne underline"
                    >
                      {dict.explore.viewOnMap}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>
    </>
  );
}
