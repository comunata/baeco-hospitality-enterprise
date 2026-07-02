"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Discreet admin entry point: a small lock icon near the footer copyright.
 * Barely visible at rest, full opacity on hover (desktop) — deliberately
 * has no "Admin" label so guests never mistake it for a client feature.
 * Once an authenticated staff/manager/owner session is detected client-side
 * (see /api/admin/whoami), it swaps to a subtle "checked" user icon as a
 * quiet acknowledgment, still linking to /admin (which shows the dashboard
 * directly since the session already exists).
 */
export function AdminAccessIcon() {
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/whoami")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.isStaff) setIsStaff(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/admin"
      aria-label={isStaff ? "Admin" : "Acces administrare"}
      title={isStaff ? "Admin" : undefined}
      className="group flex h-6 w-6 items-center justify-center rounded-full text-stone/40 opacity-60 transition-all duration-300 hover:text-champagne hover:opacity-100 md:opacity-30 md:hover:opacity-100"
    >
      {isStaff ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
          <rect x="5.5" y="10.5" width="13" height="9" rx="1.5" />
          <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" strokeLinecap="round" />
        </svg>
      )}
    </Link>
  );
}
