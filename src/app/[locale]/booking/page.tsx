import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getRooms } from "@/lib/data/rooms";
import { getServices } from "@/lib/data/services";
import { PageHeader } from "@/components/pages/PageHeader";
import { Section } from "@/components/ui/Section";
import { BookingFlow } from "@/components/booking/BookingFlow";

export default async function BookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const [rooms, services] = await Promise.all([getRooms(), getServices()]);

  return (
    <>
      <PageHeader eyebrow={dict.nav.booking} title={dict.rooms.checkAvailability} />
      <Section>
        <Suspense fallback={<p className="text-sm text-stone">{dict.common.loading}</p>}>
          <BookingFlow locale={locale} dict={dict} rooms={rooms} services={services} />
        </Suspense>
      </Section>
    </>
  );
}
