import { getServerDictionary } from "@/lib/i18n/server";
import { getAdminSession } from "@/lib/admin/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getServerDictionary();
  const session = await getAdminSession();

  if (!session.authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight px-6 text-center">
        <AdminLoginForm dict={dict} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-midnight text-ivory">
      <AdminSidebar dict={dict} role={session.role} />
      <div className="flex-1">
        <AdminHeader locale={locale} session={session} dict={dict} />
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
