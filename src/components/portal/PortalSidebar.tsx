"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PortalSidebar({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();
  const items = [
    { href: "/portal", label: dict.portal.myBookings },
    { href: "/portal/favorites", label: dict.portal.favorites },
    { href: "/portal/vouchers", label: dict.portal.vouchers },
    { href: "/portal/loyalty", label: dict.portal.loyaltyPoints },
    { href: "/portal/ai", label: dict.portal.aiConversations },
  ];

  return (
    <aside className="w-full border-b border-platinum/10 bg-graphite/40 px-4 py-6 md:w-64 md:shrink-0 md:border-b-0 md:border-r md:py-8">
      <Link href="/portal" className="mb-6 block px-3 font-display text-xl text-ivory">
        {dict.portal.title}
      </Link>
      <nav className="flex gap-1 overflow-x-auto md:block md:space-y-0.5 md:overflow-visible">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block whitespace-nowrap rounded-sm px-3 py-2 text-sm transition-colors",
                active ? "bg-champagne/10 text-champagne" : "text-ivory/80 hover:bg-platinum/5 hover:text-ivory"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
