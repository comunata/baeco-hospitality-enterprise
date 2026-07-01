"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n";

/**
 * Real Supabase Auth (email + password) login for the admin panel.
 * Calls supabase.auth.signInWithPassword — on success Supabase sets the
 * auth cookies and we refresh the server components so getAdminSession()
 * picks up the real session (including role, read from public.users).
 *
 * Admin accounts are provisioned out-of-band (Supabase dashboard / SQL),
 * unlike the portal's self-service OTP sign-up — staff shouldn't be able
 * to create their own admin accounts.
 */
export function AdminLoginForm({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = dict.admin.auth;

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError(t.genericError);
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(t.invalidCredentials);
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
      <h1 className="font-display text-2xl text-ivory">{t.title}</h1>
      <p className="mt-2 text-sm text-stone">{t.subtitle}</p>
      <form onSubmit={signIn} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-widest text-stone">{t.emailLabel}</label>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-widest text-stone">{t.passwordLabel}</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm border border-champagne/40 bg-champagne/10 px-4 py-3 text-sm uppercase tracking-widest text-champagne transition-colors hover:bg-champagne/20 disabled:opacity-50"
        >
          {loading ? t.submitting : t.submit}
        </button>
      </form>
    </div>
  );
}
