"use client";

import { useState, useRef, useEffect } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { AiAvatar } from "@/components/ai/AiAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
  handoff?: boolean;
}

export function ChatWidget({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

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
      setMessages((m) => [...m, { role: "assistant", content: data.answer, handoff: data.handoff }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: dict.errors.generic }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-sm border border-platinum/20 bg-graphite shadow-2xl animate-fade-up">
          <div className="flex items-center justify-between border-b border-platinum/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <AiAvatar kind="concierge" size={32} />
              <p className="font-display text-lg text-ivory">{dict.ai.concierge.title}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-stone hover:text-ivory">
              ✕
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && <p className="text-xs text-stone">{dict.ai.concierge.disclaimer}</p>}
            {messages.map((m, i) => (
              <div key={i} className={cn("max-w-[85%] rounded-sm px-3 py-2 text-sm", m.role === "user" ? "ml-auto bg-champagne text-midnight" : "bg-midnight text-ivory")}>
                {m.content}
                {m.handoff && (
                  <a
                    href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(dict.whatsapp.aiHandoff.replace("{{question}}", messages.at(-2)?.content ?? ""))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-xs font-medium uppercase tracking-widest text-emerald underline"
                  >
                    {dict.ai.concierge.handoffCta}
                  </a>
                )}
              </div>
            ))}
            {loading && <p className="text-xs text-stone">{dict.common.loading}</p>}
          </div>
          <div className="flex gap-2 border-t border-platinum/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={dict.ai.concierge.placeholder}
              className="flex-1 rounded-sm border border-platinum/20 bg-midnight px-3 py-2 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none"
            />
            <button onClick={send} className="rounded-sm bg-champagne px-3 py-2 text-xs font-medium uppercase tracking-widest text-midnight">
              →
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="shadow-xl transition-transform hover:scale-105"
        aria-label={dict.ai.concierge.title}
      >
        <AiAvatar kind="concierge" size={56} />
      </button>
    </div>
  );
}
