"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { AiAvatar } from "@/components/ai/AiAvatar";

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

interface RoomHit {
  id: string;
  slug: string;
  name: string;
  price: number;
  totalEstimate?: number;
  nights?: number;
  available?: boolean;
  bookingUrl?: string;
}

export function RoomFinderChat({
  locale,
  dict,
  onRecommend,
}: {
  locale: Locale;
  dict: Dictionary;
  onRecommend?: (slugs: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budget, setBudget] = useState("");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomHit[]>([]);

  async function submit() {
    if (loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/ai/room-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          checkIn,
          checkOut,
          adults,
          children,
          budgetPerNight: budget ? Number(budget) : undefined,
          preferences,
        }),
      });
      const data = await res.json();
      const hits: RoomHit[] = Array.isArray(data.rooms) ? data.rooms : [];
      setAnswer(data.answer ?? dict.errors.generic);
      setRooms(hits);
      onRecommend?.(hits.filter((r) => r.available !== false).map((r) => r.slug));
    } catch {
      setAnswer(dict.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-10 flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 rounded-full border border-champagne/40 bg-graphite px-6 py-3 text-xs font-medium uppercase tracking-widest text-champagne hover:bg-champagne/10"
        >
          <AiAvatar kind="roomFinder" size={28} />
          {dict.ai.roomFinder.cta}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-sm border border-platinum/15 bg-graphite p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AiAvatar kind="roomFinder" size={36} />
          <p className="font-display text-2xl text-ivory">{dict.ai.roomFinder.title}</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-xs uppercase tracking-widest text-stone hover:text-ivory">
          ✕
        </button>
      </div>
      <p className="mt-2 text-sm text-stone">{dict.ai.roomFinder.subtitle}</p>

      <div className="mt-6">
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          locale={locale}
          checkInLabel={dict.bookingWidget.checkIn}
          checkOutLabel={dict.bookingWidget.checkOut}
          onChange={({ checkIn: ci, checkOut: co }) => {
            setCheckIn(ci);
            setCheckOut(co);
          }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="text-xs text-stone">
          {dict.common.adults}
          <input
            type="number"
            min={1}
            max={20}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="mt-1 w-full rounded-sm border border-platinum/20 bg-midnight px-3 py-2 text-sm text-ivory focus:border-champagne focus:outline-none"
          />
        </label>
        <label className="text-xs text-stone">
          {dict.common.children}
          <input
            type="number"
            min={0}
            max={20}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="mt-1 w-full rounded-sm border border-platinum/20 bg-midnight px-3 py-2 text-sm text-ivory focus:border-champagne focus:outline-none"
          />
        </label>
        <label className="col-span-2 text-xs text-stone sm:col-span-1">
          {dict.ai.roomFinder.budgetLabel}
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="—"
            className="mt-1 w-full rounded-sm border border-platinum/20 bg-midnight px-3 py-2 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none"
          />
        </label>
        <label className="col-span-2 text-xs text-stone sm:col-span-1">
          {dict.ai.roomFinder.preferencesLabel}
          <input
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder={dict.ai.roomFinder.preferencesPlaceholder}
            className="mt-1 w-full rounded-sm border border-platinum/20 bg-midnight px-3 py-2 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none"
          />
        </label>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="mt-6 rounded-sm bg-champagne px-6 py-3 text-xs font-medium uppercase tracking-widest text-midnight disabled:opacity-60"
      >
        {loading ? dict.common.loading : dict.ai.roomFinder.submit}
      </button>

      {answer && (
        <div className="mt-6 rounded-sm border border-platinum/10 bg-midnight p-4 text-sm text-ivory">
          <p className="whitespace-pre-line">{answer}</p>
          {rooms.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {rooms.map((r) => (
                <Link
                  key={r.id}
                  href={r.available === false ? `/${locale}/rooms/${r.slug}` : r.bookingUrl ?? `/${locale}/booking?room=${r.slug}`}
                  className={`rounded-full border px-3 py-1.5 text-xs ${r.available === false ? "border-platinum/25 text-stone" : "border-champagne/30 text-champagne hover:bg-champagne/10"}`}
                >
                  {r.name}
                  {typeof r.totalEstimate === "number" && r.available !== false && ` · ${r.totalEstimate} RON`}
                  {r.available === false && (locale === "ro" ? " · indisponibilă" : " · unavailable")}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
