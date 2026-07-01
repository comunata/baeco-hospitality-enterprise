import { getServerDictionary } from "@/lib/i18n/server";
import { getPortalSession } from "@/lib/portal/session";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";
import { PortalSignOutButton } from "@/components/portal/PortalSignOutButton";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

export const metadata = { title: "Portal Client", robots: { index: false, follow: false } };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getServerDictionary();
  const session = await getPortalSession();

  if (!session.authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight px-6 text-center">
        <PortalLoginForm dict={dict} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-midnight text-ivory md:flex-row">
      <PortalSidebar dict={dict} />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-platinum/10 px-6 py-4">
          <div>
            {session.demoMode && (
              <span className="rounded-full border border-champagne/40 px-3 py-1 text-[11px] uppercase tracking-widest text-champagne">
                Demo mode — {session.fullName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher current={locale} />
            {!session.demoMode && <PortalSignOutButton dict={dict} />}
          </div>
        </header>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
