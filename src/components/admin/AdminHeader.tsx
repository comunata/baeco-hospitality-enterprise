import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import type { Locale } from "@/lib/i18n/config";
import type { AdminSession } from "@/lib/admin/session";
import type { Dictionary } from "@/lib/i18n";

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  SUPER_ADMIN: { label: "SUPER ADMIN", className: "border-champagne/50 text-champagne" },
  DEMO_ADMIN: { label: "DEMO ADMIN", className: "border-amber-400/50 text-amber-300" },
  HOTEL_ADMIN: { label: "HOTEL ADMIN", className: "border-emerald/50 text-emerald" },
};

export function AdminHeader({ locale, session, dict }: { locale: Locale; session: AdminSession; dict: Dictionary }) {
  const badge = session.role ? ROLE_BADGE[session.role] : undefined;

  return (
    <div>
      <header className="flex items-center justify-between border-b border-platinum/10 bg-midnight/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          {session.demoMode && (
            <span className="rounded-full border border-champagne/40 px-3 py-1 text-[11px] uppercase tracking-widest text-champagne">
              Demo mode — conectează Supabase pentru date live
            </span>
          )}
          {badge && (
            <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {session.email && <span className="text-xs text-stone">{session.email}</span>}
          <LocaleSwitcher current={locale} />
          {!session.demoMode && <AdminSignOutButton dict={dict} />}
        </div>
      </header>
      {session.role === "DEMO_ADMIN" && (
        <div className="border-b border-amber-400/30 bg-amber-400/10 px-6 py-2 text-center text-xs text-amber-200">
          Cont Demo – modificările nu sunt salvate.
        </div>
      )}
    </div>
  );
}
