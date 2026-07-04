"use client";

import { useState } from "react";
import type { Room } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RoomFinderChat } from "@/components/ai/RoomFinderChat";

export function RoomsExplorer({ rooms, locale, dict }: { rooms: Room[]; locale: Locale; dict: Dictionary }) {
  const [recommendedSlugs, setRecommendedSlugs] = useState<string[]>([]);

  return (
    <>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-2xl text-ivory md:text-3xl">{dict.rooms.aiFinderTitle}</h2>
        <p className="mt-2 text-sm text-stone">{dict.rooms.aiFinderSubtitle}</p>
      </div>
      <RoomFinderChat locale={locale} dict={dict} onRecommend={setRecommendedSlugs} />
      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} locale={locale} dict={dict} recommended={recommendedSlugs.includes(room.slug)} />
        ))}
      </div>
    </>
  );
}
