"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Admin entry point near the footer copyright: a quiet premium gold padlock,
 * restrained but visible — no "Admin" text label in the nav itself, just the
 * lock plus a "Hotel Admin" tooltip on hover/touch. Once an authenticated
 * staff/manager/owner session is detected client-side (see
 * /api/admin/whoami), the shackle swings open as a quiet acknowledgment,
 * still linking to /admin (which shows the dashboard directly since the
 * session already exists).
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
      aria-label="Hotel Admin"
      title="Hotel Admin"
      className="group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-champagne/75 transition-all duration-300 hover:scale-110 hover:text-champagne hover:drop-shadow-[0_0_12px_rgba(214,179,106,0.75)] active:scale-105"
    >
      {isStaff ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[21px] w-[21px]">
          <rect x="5.5" y="11" width="13" height="9" rx="1.6" />
          <path d="M8 11V8a4 4 0 0 1 7.4-2.1" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[21px] w-[21px]">
          <rect x="5.5" y="11" width="13" height="9" rx="1.6" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
        </svg>
      )}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-midnight px-2.5 py-1 text-[10px] uppercase tracking-wider text-ivory opacity-0 shadow-lg ring-1 ring-platinum/15 transition-opacity duration-300 group-hover:opacity-100">
        Hotel Admin
      </span>
    </Link>
  );
}
