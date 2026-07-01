"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { AiAvatar } from "@/components/ai/AiAvatar";

type RouteCard = {
  id: string;
  title: string;
  focus: string;
  weather: "sunny" | "rainy" | "any";
  routeLink: string;
  stops: Array<{
    time: string;
    note: string;
    name: string;
    distanceKm: number;
    driveMinutes: number;
    mapsLink: string;
  }>;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  routeCards?: RouteCard[];
};

export function LocalGuideChat({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const isRo = locale === "ro";

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setInput("");
    const next: Message[] = [{ role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/local-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, locale }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer ?? dict.errors.generic, routeCards: data.routeCards }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: dict.errors.generic }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = isRo
    ? ["Ce pot vizita în zonă?", "Unde mâncăm?", "Ce facem cu copiii?", "Ce facem dacă plouă?", "Fă-mi un plan pentru 3 zile."]
    : ["What can I visit nearby?", "Where should we eat?", "What can we do with kids?", "What if it rains?", "Plan me 3 days here."];

  return (
    <div className="overflow-hidden rounded-sm border border-emerald/25 bg-gradient-to-br from-graphite via-midnight to-graphite p-6 shadow-2xl shadow-emerald/10 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <AiAvatar kind="localGuide" size={72} />
        <div>
          <p className="font-display text-3xl text-ivory">{dict.ai.localGuide.title}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone">
            {isRo
              ? "Ghidul local AI recomandă obiective, restaurante și rute vizuale în Bucovina, cu distanțe și navigare Google Maps."
              : "The AI local guide recommends attractions, restaurants and visual Bucovina routes, with distances and Google Maps navigation."}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => send(s)} className="rounded-full border border-champagne/30 bg-midnight/35 px-3 py-1.5 text-xs text-champagne transition hover:bg-champagne/10">
            {s}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div className="mt-6 max-h-[34rem] space-y-5 overflow-y-auto rounded-sm border border-platinum/10 bg-midnight/35 p-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-sm font-medium text-champagne" : "text-sm text-ivory"}>
              {m.role === "assistant" && m.routeCards?.length ? (
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-stone">{m.content.split("\n")[0]}</p>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {m.routeCards.map((route) => (
                      <article key={route.id} className="rounded-sm border border-platinum/10 bg-graphite/55 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display text-xl text-ivory">{route.title}</h3>
                          <span className="rounded-full border border-champagne/25 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-champagne">
                            {route.weather === "rainy" ? (isRo ? "ploaie" : "rain") : route.weather === "sunny" ? (isRo ? "soare" : "sun") : "flex"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-stone">{route.focus}</p>
                        <div className="mt-4 space-y-2">
                          {route.stops.slice(0, 4).map((stop) => (
                            <div key={`${route.id}-${stop.time}-${stop.name}`} className="rounded-sm border border-platinum/10 bg-midnight/45 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium text-ivory"><span className="text-champagne">{stop.time}</span> · {stop.name}</p>
                                <a href={stop.mapsLink} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-widest text-emerald underline">
                                  {isRo ? "Hartă" : "Map"}
                                </a>
                              </div>
                              <p className="mt-1 text-[11px] leading-5 text-stone">{stop.note} · {stop.distanceKm} km / {stop.driveMinutes} min</p>
                            </div>
                          ))}
                        </div>
                        <a href={route.routeLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-sm bg-champagne px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-midnight">
                          {isRo ? "Ruta completă" : "Full route"}
                        </a>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-line leading-6">{m.content}</p>
              )}
            </div>
          ))}
          {loading && <p className="text-xs text-stone">{dict.common.loading}</p>}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={dict.ai.localGuide.placeholder}
          className="flex-1 rounded-sm border border-platinum/20 bg-midnight px-4 py-3 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none"
        />
        <button onClick={() => send()} className="rounded-sm bg-champagne px-5 text-xs font-medium uppercase tracking-widest text-midnight">
          →
        </button>
      </div>
    </div>
  );
}
