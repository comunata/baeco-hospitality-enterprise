"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";

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
    "w-full rounded-sm border border-platinum/20 bg-graphite px-4 py-3 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none";

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-2xl text-ivory">{t.signInTitle}</h1>
      <p className="mt-2 text-sm text-stone">{t.signInSubtitle}</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="text-[11px] uppercase tracking-widest text-stone">{t.identifierLabel}</label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t.identifierPlaceholder}
            className={`${fieldClass} mt-2`}
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-stone">{t.codeLabel}</label>
          <input
            type="text"
            required
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
            placeholder={t.codePlaceholder}
            className={`${fieldClass} mt-2 tracking-[0.2em]`}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-champagne px-5 py-3 text-xs font-medium uppercase tracking-widest text-midnight disabled:opacity-50"
        >
          {loading ? t.verifying : t.verify}
        </button>
      </form>
    </div>
  );
}
