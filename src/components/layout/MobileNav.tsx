"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-50 md:hidden">
      <button
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
      >
        <span className={cn("h-px w-6 bg-ivory transition-transform", open && "translate-y-2 rotate-45")} />
        <span className={cn("h-px w-6 bg-ivory transition-opacity", open && "opacity-0")} />
        <span className={cn("h-px w-6 bg-ivory transition-transform", open && "-translate-y-2 -rotate-45")} />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-t border-platinum/10 bg-midnight px-6 py-6 animate-fade-in">
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="font-display text-2xl text-ivory hover:text-champagne">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
