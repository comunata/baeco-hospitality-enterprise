import Image from "next/image";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getRoomBySlug, getRooms } from "@/lib/data/rooms";
import { getServicesByIds } from "@/lib/data/services";
import { Section } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { JsonLd, roomProductJsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const room = await getRoomBySlug(slug);
  if (!room) return {};
  return { title: room.name[locale] ?? room.name.en, description: room.description[locale] ?? room.description.en };
}

export default async function RoomDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const [includedServices, extraServices] = await Promise.all([
    getServicesByIds(room.includedServiceIds),
    getServicesByIds(room.extraServiceIds),
  ]);

  const name = room.name[locale] ?? room.name.en;
  const description = room.description[locale] ?? room.description.en;
  const rules = room.rules[locale] ?? room.rules.en;

  return (
    <>
      <JsonLd
        data={roomProductJsonLd({
          name,
          description,
          image: room.coverImage,
          price: room.basePrice,
          currency: siteConfig.currency,
          url: `${siteConfig.domain}/${locale}/rooms/${room.slug}`,
        })}
      />
      <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
        <Image src={room.coverImage} alt={name} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight to-transparent" />
      </div>

      <Section className="pt-14">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
          <div className="md:col-span-2">
            <h1 className="font-display text-4xl text-ivory md:text-5xl">{name}</h1>
            <p className="mt-6 text-base leading-relaxed text-stone">{description}</p>

            <div className="mt-10 grid grid-cols-2 gap-6 border-y border-platinum/10 py-8 sm:grid-cols-4">
              <Stat label={dict.rooms.capacity} value={`${room.maxAdults} + ${room.maxChildren}`} />
              <Stat label={dict.rooms.size} value={`${room.sizeSqm} m²`} />
              <Stat label={dict.rooms.beds} value={room.beds.join(", ")} />
              <Stat label={dict.common.from} value={formatCurrency(room.basePrice)} />
            </div>

            <div className="mt-10">
              <h2 className="font-display text-2xl text-ivory">{dict.rooms.amenities}</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-stone sm:grid-cols-3">
                {room.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2">
                    <span className="text-champagne">—</span> {a}
                  </li>
                ))}
              </ul>
            </div>

            {includedServices.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-2xl text-ivory">{dict.rooms.includedServices}</h2>
                <ul className="mt-4 space-y-2 text-sm text-stone">
                  {includedServices.map((s) => (
                    <li key={s.id}>{s.name[locale] ?? s.name.en}</li>
                  ))}
                </ul>
              </div>
            )}

            {extraServices.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-2xl text-ivory">{dict.rooms.availableExtras}</h2>
                <ul className="mt-4 grid grid-cols-1 gap-3 text-sm text-stone sm:grid-cols-2">
                  {extraServices.map((s) => (
                    <li key={s.id} className="flex justify-between border-b border-platinum/10 pb-2">
                      <span>{s.name[locale] ?? s.name.en}</span>
                      <span className="text-champagne">{formatCurrency(s.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10">
              <h2 className="font-display text-2xl text-ivory">{dict.rooms.rules}</h2>
              <p className="mt-3 text-sm text-stone">{rules}</p>
            </div>

            {room.gallery.length > 1 && (
              <div className="mt-10 grid grid-cols-2 gap-4">
                {room.gallery.slice(1).map((src, i) => (
                  <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-sm">
                    <Image src={src} alt={`${name} ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="md:col-span-1">
            <div className="sticky top-28 rounded-sm border border-platinum/15 bg-graphite p-8">
              <p className="text-xs uppercase tracking-widest text-stone">{dict.rooms.priceFrom}</p>
              <p className="font-display text-4xl text-champagne">
                {formatCurrency(room.basePrice)}
                <span className="text-sm text-stone">{dict.common.perNight}</span>
              </p>
              <LinkButton href={`/${locale}/booking?room=${room.slug}`} className="mt-6 w-full">
                {dict.rooms.checkAvailability}
              </LinkButton>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-stone">{label}</p>
      <p className="mt-1 font-display text-lg text-ivory">{value}</p>
    </div>
  );
}

export async function generateStaticParams() {
  const rooms = await getRooms();
  return rooms.flatMap((r) => [
    { locale: "ro", slug: r.slug },
    { locale: "en", slug: r.slug },
  ]);
}
