import Image from "next/image";
import Link from "next/link";
import type { Room } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export function RoomCard({ room, locale, dict, priority = false }: { room: Room; locale: Locale; dict: Dictionary; priority?: boolean }) {
  const name = room.name[locale] ?? room.name.en;
  const description = room.description[locale] ?? room.description.en;

  return (
    <Card className="group overflow-hidden">
      <Link href={`/${locale}/rooms/${room.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={room.coverImage}
            alt={name}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <h3 className="font-display text-2xl text-ivory">{name}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-stone">{description}</p>
          <div className="mt-4 flex items-center justify-between border-t border-platinum/10 pt-4">
            <div className="text-xs uppercase tracking-widest text-stone">
              {room.maxAdults} {dict.common.adults} · {room.sizeSqm} m²
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-stone">{dict.rooms.priceFrom}</p>
              <p className="font-display text-xl text-champagne">
                {formatCurrency(room.basePrice)}
                <span className="text-xs text-stone">{dict.common.perNight}</span>
              </p>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
