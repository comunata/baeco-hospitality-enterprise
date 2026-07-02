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

export function ChatWidget({ locale, dict, whatsapp }: { locale: Locale; dict: Dictionary; whatsapp?: string }) {
  const whatsappNumber = whatsapp || siteConfig.contact.whatsapp;
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
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(dict.whatsapp.aiHandoff.replace("{{question}}", messages.at(-2)?.content ?? ""))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-full bg-emerald px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-midnight shadow-lg shadow-emerald/20 transition-transform hover:scale-[1.03]"
                  >
                    <svg viewBox="0 0 32 32" fill="currentColor" className="h-4 w-4 shrink-0">
                      <path d="M16.02 3C9.4 3 4 8.37 4 15c0 2.36.68 4.55 1.87 6.42L4 29l7.77-1.83A11.9 11.9 0 0 0 16.02 27C22.63 27 28 21.63 28 15S22.63 3 16.02 3Zm6.98 16.9c-.3.83-1.7 1.58-2.35 1.68-.6.09-1.36.13-2.2-.14-.5-.16-1.15-.37-1.98-.73-3.48-1.5-5.75-5-5.92-5.24-.17-.24-1.42-1.89-1.42-3.6 0-1.72.9-2.56 1.22-2.91.31-.34.68-.43.9-.43.23 0 .46 0 .66.01.21.01.5-.08.78.6.3.71 1 2.46 1.09 2.64.09.18.15.4.03.64-.12.24-.18.4-.36.61-.18.21-.38.47-.54.63-.18.18-.37.37-.16.73.21.35.93 1.53 2 2.48 1.37 1.22 2.53 1.6 2.88 1.78.35.18.56.15.76-.09.21-.24.88-1.03 1.12-1.38.24-.35.47-.29.79-.18.32.12 2.05.97 2.4 1.14.35.18.58.26.67.41.09.15.09.85-.21 1.68Z" />
                    </svg>
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
