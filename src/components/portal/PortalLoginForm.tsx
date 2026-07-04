"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

/**
 * Portal Client login: email-or-phone + the BD-XXXXXX booking code printed
 * on the confirmation email — no Supabase Auth, no account, no magic-link/
 * OTP email. On success the server sets a signed session cookie (see
 * api/portal/login/route.ts) scoped to that one booking, and we refresh so
 * getPortalSession() picks it up.
 */
export function PortalLoginForm({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = dict.portal.auth;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, bookingCode }),
      });
      if (!res.ok) {
        setError(t.invalidCode);
        return;
      }
      router.refresh();
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-sm border border-platinum/20 bg-graphite py-3 pl-11 pr-4 text-sm text-ivory placeholder:text-stone transition-shadow duration-300 focus:border-champagne focus:shadow-[0_0_0_3px_rgba(214,179,106,0.28)] focus:outline-none";

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-champagne/40 text-champagne">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-5 w-5">
          <path d="M12 3 20 7v6c0 4.2-3.2 7.7-8 8-4.8-.3-8-3.8-8-8V7l8-4Z" strokeLinejoin="round" />
          <path d="M9 12.2 11.2 14.4 15.5 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-display text-2xl text-ivory">{t.signInTitle}</h1>
      <p className="mt-2 text-sm text-stone">{t.signInSubtitle}</p>

      <form onSubmit={submit} className="mt-6 space-y-4 text-left">
        <div>
          <label className="text-[11px] uppercase tracking-widest text-stone">{t.identifierLabel}</label>
          <div className="relative mt-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
            >
              <rect x="3.5" y="5.5" width="17" height="13" rx="1.6" />
              <path d="M4 6.5 12 12.5 20 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t.identifierPlaceholder}
              className={fieldClass}
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-stone">{t.codeLabel}</label>
          <div className="relative mt-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
            >
              <path d="M4 9a2 2 0 0 0 0 4v3.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V13a2 2 0 0 0 0-4V6.5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1V9Z" />
              <path d="M13 6v11" strokeDasharray="1.6 1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              required
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
              placeholder={t.codePlaceholder}
              className={`${fieldClass} tracking-[0.2em]`}
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t.verifying : t.verify}
        </Button>
      </form>
    </div>
  );
}
