import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getOffers } from "@/lib/data/content";
import { PageHeader } from "@/components/pages/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default async function OffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const offers = await getOffers();

  return (
    <>
      <PageHeader eyebrow={dict.nav.offers} title={dict.home.sectionsOffersTitle} />
      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.id} className="flex flex-col p-8">
              {offer.discountPercent && <p className="mb-3 font-display text-4xl text-champagne">-{offer.discountPercent}%</p>}
              <h3 className="font-display text-2xl text-ivory">{offer.title[locale] ?? offer.title.en}</h3>
              <p className="mt-2 flex-1 text-sm text-stone">{offer.description[locale] ?? offer.description.en}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-stone">
                {formatDate(offer.validFrom, locale === "ro" ? "ro-RO" : "en-GB")} – {formatDate(offer.validTo, locale === "ro" ? "ro-RO" : "en-GB")}
              </p>
              <LinkButton href={`/${locale}/booking`} variant="secondary" className="mt-6">
                {dict.common.bookNow}
              </LinkButton>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
