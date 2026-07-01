import { notFound } from "next/navigation";
import Image from "next/image";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { getAttractions, getLocalEvents } from "@/lib/data/explore";
import { getApprovedPlaces } from "@/lib/data/discovery";
import type { BdCategory, DiscoveredPlace } from "@/lib/discovery/types";
import { destinationRoutes } from "@/lib/data/destination";
import { getWeatherToday } from "@/lib/integrations/weather";
import { PageHeader } from "@/components/pages/PageHeader";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { LocalGuideChat } from "@/components/ai/LocalGuideChat";
import { DestinationExpertPanel } from "@/components/ai/DestinationExpertPanel";
import { formatDate } from "@/lib/utils";
import type { Attraction, LocalEvent } from "@/lib/types";

// Curated, per-item photo overrides for the seed attractions so each card
// shows what it actually is (a fortress isn't a monastery isn't a cafe).
// Falls back to a category-appropriate pool below for anything without a
// dedicated match (e.g. attractions added later from the admin panel).
const attractionImageOverrides: Record<string, string> = {
  "attr-old-town": "/images/explore/0b426843dddfece952b3c3aa027bd354.jpg",
  "attr-lake-trail": "/images/explore/bicaz-lake.webp",
  "attr-fortress": "/images/explore/d15adec32154b69a742f02e2f60b36f9.jpg",
  "attr-trattoria": "/images/restaurant/restaurant-terrace.webp",
  "attr-local-bistro": "/images/restaurant/bistro-local.webp",
  "attr-coffee-house": "/images/restaurant/cafe-house.webp",
  "attr-farmers-market": "/images/explore/2a087e23a961d9666ae8723d804fa4ac.jpg",
  "attr-cheese-producer": "/images/restaurant/cheese-producer.webp",
};

const categoryImagePools: Record<Attraction["category"], string[]> = {
  attraction: [
    "/images/explore/voronet.webp",
    "/images/explore/sucevita.webp",
    "/images/explore/76bd2ebff6a2a70946f711da036ba39b.jpg",
    "/images/explore/7da693d35809543df6b6f00e974dbadf.jpg",
    "/images/explore/aad6d71e5cc8168f3b107ef126924f95.jpg",
    "/images/explore/2dfb12d1da3716e851848a54d2a77121.jpg",
  ],
  restaurant: [
    "/images/restaurant/restaurant-interior.webp",
    "/images/restaurant/restaurant-terrace.webp",
    "/images/restaurant/bistro-local.webp",
    "/images/restaurant/breakfast-lake.webp",
  ],
  cafe: ["/images/restaurant/cafe-house.webp", "/images/restaurant/cafe-interior-alt.jpg"],
  market: ["/images/explore/2a087e23a961d9666ae8723d804fa4ac.jpg", "/images/explore/f799e86ae64e8d883962426c657bf965.jpg"],
  shop: ["/images/explore/2a087e23a961d9666ae8723d804fa4ac.jpg", "/images/explore/f799e86ae64e8d883962426c657bf965.jpg"],
  producer: ["/images/restaurant/cheese-producer.webp", "/images/explore/cheese-cellar.webp"],
};

function imageFor(attraction: Attraction, index: number) {
  if (attraction.image) return attraction.image;
  if (attractionImageOverrides[attraction.id]) return attractionImageOverrides[attraction.id];
  const pool = categoryImagePools[attraction.category];
  return pool[index % pool.length];
}

/**
 * Approved places from the Hospitality Intelligence Engine are merged into
 * the Explore sections. Experience categories map onto the page's sections;
 * practical ones (transport/health/fuel/services) stay out of Explore — they
 * serve the AI Concierge, not the discovery narrative.
 */
const bdToExploreCategory: Partial<Record<BdCategory, Attraction["category"]>> = {
  attraction: "attraction",
  culture: "attraction",
  nature: "attraction",
  trail: "attraction",
  adventure: "attraction",
  sport: "attraction",
  wellness: "attraction",
  family: "attraction",
  restaurant: "restaurant",
  bar: "restaurant",
  cafe: "cafe",
  shopping: "shop",
  market: "market",
  producer: "producer",
};

function discoveredToAttraction(place: DiscoveredPlace): Attraction | null {
  const category = bdToExploreCategory[place.category];
  if (!category) return null;
  return {
    id: `discovered-${place.id}`,
    name: { ro: place.name, en: place.nameEn ?? place.name },
    category,
    description: place.description,
    image: place.image,
    distanceKm: place.distanceKm,
    driveMinutes: place.driveMinutes,
    tags: place.tags,
    goodFor: place.goodFor.filter((g): g is Attraction["goodFor"][number] => ["family", "romantic", "rainy-day", "kids"].includes(g)),
    lat: place.lat,
    lng: place.lng,
  };
}

const categoryLabelKey: Record<Attraction["category"], keyof Dictionary["explore"]> = {
  attraction: "attractions",
  restaurant: "restaurants",
  cafe: "cafes",
  market: "marketsAndProducers",
  shop: "marketsAndProducers",
  producer: "marketsAndProducers",
};

function ExploreCard({ item, locale, dict, image }: { item: Attraction; locale: Locale; dict: Dictionary; image: string }) {
  const name = item.name[locale] ?? item.name.en;
  const description = item.description[locale] ?? item.description.en;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-champagne/30">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg text-ivory">{name}</h3>
          <span className="shrink-0 rounded-full border border-champagne/25 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-champagne">
            {item.distanceKm} km · {item.driveMinutes} min
          </span>
        </div>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-stone">{description}</p>
        <a
          href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-champagne transition-colors duration-300 hover:text-ivory"
        >
          {dict.explore.viewOnMap}
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </a>
      </div>
    </Card>
  );
}

function EventCard({ event, locale, dict }: { event: LocalEvent; locale: Locale; dict: Dictionary }) {
  const name = event.name[locale] ?? event.name.en;
  const description = event.description[locale] ?? event.description.en;

  return (
    <Card className="flex h-full flex-col gap-3 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-champagne/30">
      <span className="w-fit rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald">
        {formatDate(event.date, locale === "ro" ? "ro-RO" : "en-US")}
      </span>
      <h3 className="font-display text-lg text-ivory">{name}</h3>
      <p className="flex-1 text-sm leading-6 text-stone">{description}</p>
      <p className="text-xs uppercase tracking-widest text-champagne">{event.location}</p>
      <span className="text-[10px] uppercase tracking-widest text-stone">{dict.explore.localEvents}</span>
    </Card>
  );
}

export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const [seedAttractionsList, events, weather, approvedPlaces] = await Promise.all([
    getAttractions(),
    getLocalEvents(),
    getWeatherToday(),
    getApprovedPlaces().catch(() => []),
  ]);

  // Merge Intelligence Engine results into the curated list, deduped by name.
  const knownNames = new Set(seedAttractionsList.map((a) => (a.name.ro ?? a.name.en ?? "").toLowerCase()));
  const discovered = approvedPlaces
    .map(discoveredToAttraction)
    .filter((a): a is Attraction => a !== null && !knownNames.has(a.name.ro.toLowerCase()));
  const attractions = [...seedAttractionsList, ...discovered];

  const attractionItems = attractions.filter((a) => a.category === "attraction");
  const restaurantItems = attractions.filter((a) => a.category === "restaurant");
  const cafeItems = attractions.filter((a) => a.category === "cafe");
  const marketAndProducerItems = attractions.filter((a) => a.category === "market" || a.category === "producer" || a.category === "shop");

  const sections: { key: string; items: Attraction[] }[] = [
    { key: "attraction", items: attractionItems },
    { key: "restaurant", items: restaurantItems },
    { key: "cafe", items: cafeItems },
    { key: "marketsAndProducers", items: marketAndProducerItems },
  ].filter((s) => s.items.length > 0);

  return (
    <>
      <PageHeader eyebrow={dict.nav.explore} title={dict.explore.title} subtitle={dict.explore.subtitle} />
      <Section>
        {/* Subtle hero stats: weather, counts and recommended stay — no clutter. */}
        <div className="mb-12 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-sm border border-platinum/10 bg-graphite/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl text-champagne">{weather.tempC}°C</span>
            <span className="text-sm text-stone">{dict.explore.weather} · {weather.condition}</span>
          </div>
          <span className="hidden h-8 w-px bg-platinum/15 sm:block" aria-hidden />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-widest text-stone">
            <span><span className="font-display text-base text-champagne">{attractionItems.length}</span> {dict.explore.statAttractions}</span>
            <span><span className="font-display text-base text-champagne">{restaurantItems.length + cafeItems.length}</span> {dict.explore.statRestaurants}</span>
            <span><span className="font-display text-base text-champagne">{destinationRoutes.length}</span> {dict.explore.statRoutes}</span>
            <span><span className="font-display text-base text-champagne">{dict.explore.recommendedStayValue}</span> {dict.explore.recommendedStay}</span>
          </div>
        </div>

        <div className="mb-20">
          <DestinationExpertPanel locale={locale} />
        </div>

        {sections.map(({ key, items }) => (
          <div key={key} className="mb-20">
            <SectionHeading title={dict.explore[categoryLabelKey[items[0].category]]} />
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {items.map((item, i) => (
                <ExploreCard key={item.id} item={item} locale={locale} dict={dict} image={imageFor(item, i)} />
              ))}
            </div>
          </div>
        ))}

        {events.length > 0 && (
          <div className="mb-20">
            <SectionHeading title={dict.explore.localEvents} />
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} locale={locale} dict={dict} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-20">
          <LocalGuideChat locale={locale} dict={dict} />
        </div>

        {/* Single, final CTA — booking is the natural next step after exploring, not an interruption. */}
        <div className="flex flex-col items-center gap-5 rounded-sm border border-champagne/30 bg-gradient-to-br from-graphite via-midnight to-graphite px-8 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-champagne">{dict.nav.explore}</p>
          <h2 className="max-w-2xl font-display text-3xl text-ivory md:text-4xl">{dict.explore.ctaTitle}</h2>
          <p className="max-w-xl text-stone">{dict.explore.ctaSubtitle}</p>
          <LinkButton href={`/${locale}/booking`} className="mt-2">
            {dict.common.bookNow}
          </LinkButton>
        </div>
      </Section>
    </>
  );
}
