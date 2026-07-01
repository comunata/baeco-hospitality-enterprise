import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getRooms } from "@/lib/data/rooms";
import { getOffers } from "@/lib/data/content";
import { getReviews } from "@/lib/data/content";
import { getAttractions } from "@/lib/data/explore";
import { seedFacilities } from "@/lib/data/seed/facilities";
import { seedFaq } from "@/lib/data/seed/faq";
import { notFound } from "next/navigation";
import { Section, SectionHeading } from "@/components/ui/Section";
import { RoomCard } from "@/components/rooms/RoomCard";
import { Testimonials } from "@/components/home/Testimonials";
import { Hero } from "@/components/home/Hero";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { JsonLd, lodgingBusinessJsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const [rooms, offers, reviews, attractions] = await Promise.all([getRooms(), getOffers(), getReviews(), getAttractions()]);

  return (
    <>
      <JsonLd
        data={lodgingBusinessJsonLd({
          name: siteConfig.name,
          description: dict.seo.defaultDescription,
          url: `${siteConfig.domain}/${locale}`,
          telephone: siteConfig.contact.phone,
          address: siteConfig.contact.address,
          lat: siteConfig.contact.lat,
          lng: siteConfig.contact.lng,
        })}
      />
      <Hero locale={locale} dict={dict} />

      <Section>
        <SectionHeading eyebrow={dict.nav.rooms} title={dict.home.sectionsRoomsTitle} subtitle={dict.home.sectionsRoomsSubtitle} />
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {rooms.slice(0, 3).map((room, index) => (
            <RoomCard key={room.id} room={room} locale={locale} dict={dict} priority={index === 0} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <LinkButton href={`/${locale}/rooms`} variant="secondary">
            {dict.common.viewAll}
          </LinkButton>
        </div>
      </Section>

      <Section className="bg-graphite/40">
        <SectionHeading eyebrow={dict.nav.facilities} title={dict.home.sectionsFacilitiesTitle} align="center" />
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {seedFacilities.map((facility) => (
            <div key={facility.id} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-champagne/30 text-2xl text-champagne">
                {facility.icon}
              </div>
              <h3 className="font-display text-xl text-ivory">{facility.name[locale] ?? facility.name.en}</h3>
              <p className="mt-2 text-sm text-stone">{facility.description[locale] ?? facility.description.en}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow={dict.nav.offers} title={dict.home.sectionsOffersTitle} />
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.id} className="p-8">
              {offer.discountPercent && (
                <p className="mb-3 font-display text-3xl text-champagne">-{offer.discountPercent}%</p>
              )}
              <h3 className="font-display text-xl text-ivory">{offer.title[locale] ?? offer.title.en}</h3>
              <p className="mt-2 text-sm text-stone">{offer.description[locale] ?? offer.description.en}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-graphite/40">
        <SectionHeading eyebrow={dict.nav.explore} title={dict.home.sectionsExploreTitle} subtitle={dict.home.sectionsExploreSubtitle} />
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          {attractions.slice(0, 4).map((a) => (
            <div key={a.id}>
              <h3 className="font-display text-lg text-ivory">{a.name[locale] ?? a.name.en}</h3>
              <p className="mt-1 text-xs uppercase tracking-widest text-champagne">
                {a.distanceKm} km · {a.driveMinutes} min
              </p>
              <p className="mt-2 text-sm text-stone">{a.description[locale] ?? a.description.en}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <LinkButton href={`/${locale}/explore`} variant="secondary">
            {dict.common.viewAll}
          </LinkButton>
        </div>
      </Section>

      <Section>
        <SectionHeading title={dict.home.sectionsTestimonialsTitle} align="center" />
        <div className="mt-12">
          <Testimonials reviews={reviews} />
        </div>
      </Section>

      <Section className="bg-graphite/40">
        <SectionHeading title={dict.home.sectionsFaqTitle} align="center" />
        <div className="mx-auto mt-12 max-w-3xl">
          <FaqAccordion items={seedFaq.slice(0, 5).map((f) => ({ question: f.question[locale] ?? f.question.en, answer: f.answer[locale] ?? f.answer.en }))} />
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-center gap-6 rounded-sm border border-champagne/30 bg-graphite px-8 py-16 text-center">
          <h2 className="font-display text-3xl text-ivory md:text-4xl">{dict.home.sectionsContactTitle}</h2>
          <p className="max-w-md text-stone">{formatCurrency(rooms[0]?.basePrice ?? 0)} {dict.common.perNight}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <LinkButton href={`/${locale}/contact`}>{dict.nav.contact}</LinkButton>
            <Link href={`/${locale}/booking`} className="text-sm uppercase tracking-widest text-champagne underline underline-offset-4">
              {dict.common.bookNow}
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
