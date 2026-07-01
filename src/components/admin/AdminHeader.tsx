import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import type { Locale } from "@/lib/i18n/config";
import type { AdminSession } from "@/lib/admin/session";
import type { Dictionary } from "@/lib/i18n";

export function AdminHeader({ locale, session, dict }: { locale: Locale; session: AdminSession; dict: Dictionary }) {
  return (
    <header className="flex items-center justify-between border-b border-platinum/10 bg-midnight/80 px-6 py-4 backdrop-blur">
      <div>
        {session.demoMode && (
          <span className="rounded-full border border-champagne/40 px-3 py-1 text-[11px] uppercase tracking-widest text-champagne">
            Demo mode — conectează Supabase pentru date live
          </span>
        )}
        {session.role && <span className="text-xs text-stone">Rol: {session.role}</span>}
      </div>
      <div className="flex items-center gap-4">
        {session.email && <span className="text-xs text-stone">{session.email}</span>}
        <LocaleSwitcher current={locale} />
        {!session.demoMode && <AdminSignOutButton dict={dict} />}
      </div>
    </header>
  );
}
