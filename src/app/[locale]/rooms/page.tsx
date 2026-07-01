import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getRooms } from "@/lib/data/rooms";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/pages/PageHeader";
import { Section } from "@/components/ui/Section";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RoomFinderChat } from "@/components/ai/RoomFinderChat";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.rooms.title };
}

export default async function RoomsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const rooms = await getRooms();

  return (
    <>
      <PageHeader eyebrow={dict.nav.rooms} title={dict.rooms.title} />
      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} locale={locale} dict={dict} />
          ))}
        </div>
        <RoomFinderChat locale={locale} dict={dict} />
      </Section>
    </>
  );
}
