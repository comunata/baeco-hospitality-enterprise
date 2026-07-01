"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { AiAvatar } from "@/components/ai/AiAvatar";

interface ServiceHit {
  id: string;
  name: string;
  price: number;
  chargeType: string;
}

export function UpsellRecommendations({ code, locale, dict }: { code: string; locale: Locale; dict: Dictionary }) {
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceHit[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ai/upsell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, locale }),
        });
        const data = await res.json();
        if (cancelled) return;
        setAnswer(data.answer ?? null);
        setServices(Array.isArray(data.services) ? data.services : []);
      } catch {
        if (!cancelled) setAnswer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [code, locale]);

  if (!loading && !answer) return null;

  return (
    <div className="mt-8 rounded-sm border border-champagne/30 bg-graphite/60 p-6">
      <div className="flex items-center gap-3">
        <AiAvatar kind="upsell" size={32} />
        <h2 className="font-display text-xl text-ivory">{dict.ai.upsell.title}</h2>
      </div>
      <p className="mt-1 text-sm text-stone">{dict.ai.upsell.subtitle}</p>
      {loading && <p className="mt-4 text-xs text-stone">{dict.ai.upsell.loading}</p>}
      {!loading && answer && (
        <div className="mt-4 text-sm text-ivory">
          <p className="whitespace-pre-line">{answer}</p>
          {services.length > 0 && (
            <ul className="mt-4 space-y-2">
              {services.map((s) => (
                <li key={s.id} className="flex justify-between border-t border-platinum/10 pt-2 text-sm">
                  <span>{s.name}</span>
                  <span className="text-champagne">{s.price} RON</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
