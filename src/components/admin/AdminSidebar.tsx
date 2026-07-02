"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavGroups } from "@/config/adminNav";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AdminSidebar({ dict, role }: { dict: Dictionary; role?: string }) {
  const pathname = usePathname();
  const isSuperAdmin = role === "SUPER_ADMIN" || role === undefined; // demo-mode sandbox (no role at all) stays fully open

  return (
    <aside className="hidden w-64 shrink-0 border-r border-platinum/10 bg-graphite/40 px-4 py-8 md:block">
      <Link href="/admin" className="mb-8 block px-3 font-display text-xl text-ivory">
        {dict.common.brand} <span className="text-champagne">Admin</span>
      </Link>
      <nav className="space-y-6">
        {adminNavGroups.map((group) => {
          const items = group.items.filter((item) => !item.superAdminOnly || isSuperAdmin);
          if (items.length === 0) return null;
          return (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone">{group.title}</p>
            <div className="mt-2 space-y-0.5">
              {items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-sm px-3 py-2 text-sm transition-colors",
                      active ? "bg-champagne/10 text-champagne" : "text-ivory/80 hover:bg-platinum/5 hover:text-ivory"
                    )}
                  >
                    {dict.admin.nav[item.labelKey]}
                  </Link>
                );
              })}
            </div>
          </div>
          );
        })}
      </nav>
    </aside>
  );
}
