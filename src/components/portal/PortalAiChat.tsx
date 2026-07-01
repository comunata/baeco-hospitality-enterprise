"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { AiAvatar } from "@/components/ai/AiAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "baeco-ai-conversation";

export function PortalAiChat({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reads a browser-only API unavailable during SSR, so this can't be a lazy useState initializer.
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage, not a derived-state loop
      if (Array.isArray(stored)) setMessages(stored);
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, locale, history: next.slice(-6) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: dict.errors.generic }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-sm border border-platinum/15 bg-graphite">
      <div className="flex items-center gap-3 border-b border-platinum/10 p-4">
        <AiAvatar kind="concierge" size={32} />
        <p className="font-display text-lg text-ivory">{dict.ai.concierge.title}</p>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-6">
        {messages.length === 0 && <p className="text-sm text-stone">{dict.ai.concierge.disclaimer}</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[80%] rounded-sm bg-champagne px-3 py-2 text-sm text-midnight" : "max-w-[80%] rounded-sm bg-midnight px-3 py-2 text-sm text-ivory"}>
            {m.content}
          </div>
        ))}
        {loading && <p className="text-xs text-stone">{dict.common.loading}</p>}
      </div>
      <div className="flex gap-2 border-t border-platinum/10 p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={dict.ai.concierge.placeholder}
          className="flex-1 rounded-sm border border-platinum/20 bg-midnight px-4 py-3 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none"
        />
        <button onClick={send} className="rounded-sm bg-champagne px-5 text-xs font-medium uppercase tracking-widest text-midnight">
          →
        </button>
      </div>
    </div>
  );
}
