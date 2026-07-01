import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getLocalEvents } from "@/lib/data/explore";
import { PageHeader } from "@/components/pages/PageHeader";
import { Section } from "@/components/ui/Section";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const events = await getLocalEvents();

  return (
    <>
      <PageHeader eyebrow={dict.nav.events} title={dict.nav.events} />
      <Section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className="p-8">
              <p className="text-xs uppercase tracking-widest text-champagne">{formatDate(event.date, locale === "ro" ? "ro-RO" : "en-GB")}</p>
              <h3 className="mt-2 font-display text-2xl text-ivory">{event.name[locale] ?? event.name.en}</h3>
              <p className="mt-2 text-sm text-stone">{event.description[locale] ?? event.description.en}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-stone">{event.location}</p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
