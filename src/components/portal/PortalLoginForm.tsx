"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n";

/**
 * Real Supabase OTP (email one-time-passcode) login for the Portal Client.
 * Step 1: collects the email and calls supabase.auth.signInWithOtp.
 * Step 2: collects the 6-digit code emailed to the guest and calls
 * supabase.auth.verifyOtp — on success Supabase sets the auth cookies and
 * we refresh the server components so getPortalSession() picks up the
 * real session.
 */
export function PortalLoginForm({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = dict.portal.auth;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError(t.genericError);
      return;
    }
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (otpError) {
        setError(otpError.message || t.genericError);
        return;
      }
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError(t.genericError);
      return;
    }
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (verifyError) {
        setError(t.invalidCode);
        return;
      }
      router.refresh();
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

      {step === "email" && (
        <form onSubmit={sendCode} className="mt-6 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-widest text-stone">{t.emailLabel}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className={`${fieldClass} mt-2`}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-champagne px-5 py-3 text-xs font-medium uppercase tracking-widest text-midnight disabled:opacity-50"
          >
            {loading ? t.sending : t.sendCode}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} className="mt-6 space-y-4">
          <p className="text-sm text-stone">
            {t.codeSentTo} <span className="text-ivory">{email}</span>
          </p>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-stone">{t.codeLabel}</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.codePlaceholder}
              className={`${fieldClass} mt-2 tracking-[0.3em]`}
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
          <div className="flex justify-between text-xs text-stone">
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }} className="underline">
              {t.changeEmail}
            </button>
            <button type="button" onClick={sendCode as unknown as () => void} className="underline">
              {t.resendCode}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
