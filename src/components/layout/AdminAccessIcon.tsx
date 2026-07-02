"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Admin entry point near the footer copyright: clearly recognizable (shield +
 * lock) but still restrained — no "Admin" text label, gold hover glow only,
 * so it reads as a quiet security mark rather than a loud nav item.
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
      aria-label={isStaff ? "Panou Admin" : "Administrare"}
      title={isStaff ? "Panou Admin" : "Administrare"}
      className="group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone/70 opacity-90 transition-all duration-300 hover:scale-110 hover:text-champagne hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(212,175,110,0.6)]"
    >
      {isStaff ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[21px] w-[21px]">
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[21px] w-[21px]">
          <path d="M12 3.5 5.5 6v5.2c0 4.2 2.7 7.6 6.5 8.8 3.8-1.2 6.5-4.6 6.5-8.8V6L12 3.5Z" strokeLinejoin="round" />
          <rect x="9.4" y="11.4" width="5.2" height="4.2" rx="0.9" />
          <path d="M10.6 11.4v-1.5a1.4 1.4 0 0 1 2.8 0v1.5" strokeLinecap="round" />
        </svg>
      )}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-midnight px-2.5 py-1 text-[10px] uppercase tracking-wider text-ivory opacity-0 shadow-lg ring-1 ring-platinum/15 transition-opacity duration-200 group-hover:opacity-100">
        {isStaff ? "Panou Admin" : "Administrare"}
      </span>
    </Link>
  );
}
