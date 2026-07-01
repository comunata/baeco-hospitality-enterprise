"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Room } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

const STORAGE_KEY = "baeco-favorites";

export function FavoritesClient({ rooms, dict }: { rooms: Room[]; dict: Dictionary }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    // Reads a browser-only API unavailable during SSR, so this can't be a lazy useState initializer.
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage, not a derived-state loop
      if (Array.isArray(stored)) setFavoriteIds(stored);
    } catch {
      // ignore malformed storage
    }
  }, []);

  function toggle(id: string) {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {rooms.map((room) => {
        const isFavorite = favoriteIds.includes(room.id);
        return (
          <div key={room.id} className="overflow-hidden rounded-sm border border-platinum/10 bg-graphite">
            <div className="relative aspect-[4/3]">
              <Image src={room.coverImage} alt={room.name.ro} fill sizes="50vw" className="object-cover" />
              <button
                onClick={() => toggle(room.id)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-midnight/80 text-lg"
                aria-label="favorite"
              >
                {isFavorite ? "★" : "☆"}
              </button>
            </div>
            <div className="p-5">
              <Link href={`/ro/rooms/${room.slug}`} className="font-display text-lg text-ivory hover:text-champagne">
                {room.name.ro}
              </Link>
              <p className="mt-2 text-sm text-champagne">
                {formatCurrency(room.basePrice)} <span className="text-xs text-stone">{dict.common.perNight}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
