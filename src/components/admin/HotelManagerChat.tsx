"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { AiAvatar } from "@/components/ai/AiAvatar";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

export function HotelManagerChat({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);

  async function submit() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setTurns((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuestion("");
    try {
      const res = await fetch("/api/ai/hotel-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, locale }),
      });
      const data = await res.json();
      setTurns((prev) => [...prev, { role: "assistant", content: data.answer ?? dict.errors.generic }]);
    } catch {
      setTurns((prev) => [...prev, { role: "assistant", content: dict.errors.generic }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-sm border border-platinum/15 bg-graphite p-6 md:p-8">
      <div className="flex items-center gap-3">
        <AiAvatar kind="hotelManager" size={40} />
        <p className="font-display text-2xl text-ivory">{dict.ai.hotelManager.title}</p>
      </div>
      <p className="mt-2 text-sm text-stone">{dict.ai.hotelManager.subtitle}</p>

      <div className="mt-6 max-h-[420px] space-y-4 overflow-y-auto">
        {turns.map((t, i) => (
          <div
            key={i}
            className={
              t.role === "user"
                ? "ml-auto max-w-[85%] rounded-sm bg-champagne/10 px-4 py-2 text-sm text-ivory"
                : "mr-auto max-w-[85%] rounded-sm border border-platinum/10 bg-midnight px-4 py-2 text-sm text-ivory"
            }
          >
            <p className="whitespace-pre-line">{t.content}</p>
          </div>
        ))}
        {loading && <p className="text-xs text-stone">{dict.common.loading}</p>}
      </div>

      <div className="mt-6 flex gap-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={dict.ai.hotelManager.placeholder}
          className="flex-1 rounded-sm border border-platinum/20 bg-midnight px-4 py-3 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-sm bg-champagne px-6 py-3 text-xs font-medium uppercase tracking-widest text-midnight disabled:opacity-60"
        >
          {dict.ai.hotelManager.submit}
        </button>
      </div>
    </div>
  );
}
