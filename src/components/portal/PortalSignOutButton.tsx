"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n";

export function PortalSignOutButton({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className="rounded-sm border border-platinum/20 px-3 py-1.5 text-[11px] uppercase tracking-widest text-ivory/80 transition-colors hover:border-champagne/40 hover:text-champagne disabled:opacity-50"
    >
      {dict.portal.signOut}
    </button>
  );
}
