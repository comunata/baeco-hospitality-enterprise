"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";

export function ContactForm({ dict }: { dict: Dictionary }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  const fieldClass =
    "w-full rounded-sm border border-platinum/20 bg-graphite px-4 py-3 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none";

  if (status === "sent") {
    return <p className="rounded-sm border border-emerald/40 bg-emerald/10 px-6 py-8 text-center text-ivory">{dict.contact.sent}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input required placeholder={dict.contact.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} />
      <input required type="email" placeholder={dict.contact.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass} />
      <textarea required rows={5} placeholder={dict.contact.message} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={fieldClass} />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-sm bg-champagne px-7 py-3.5 text-sm font-medium uppercase tracking-[0.15em] text-midnight transition-colors hover:bg-champagne/90 disabled:opacity-60"
      >
        {status === "sending" ? dict.common.loading : dict.contact.send}
      </button>
      {status === "error" && <p className="text-sm text-red-400">{dict.errors.generic}</p>}
    </form>
  );
}
