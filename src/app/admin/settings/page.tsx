import { getServerDictionary } from "@/lib/i18n/server";
import { MODULES } from "@/config/modules";
import { requireAdminRole } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getBookingSettings, getModuleFlags } from "@/lib/data/settings";
import { getPropertyContactInfo } from "@/lib/data/property";
import { siteConfig } from "@/config/site";
import { ModuleToggle } from "./ModuleToggle";
import { BookingSettingsForm } from "./BookingSettingsForm";
import { PropertyContactForm } from "./PropertyContactForm";

export default async function AdminSettingsPage() {
  await requireAdminRole("HOTEL_ADMIN");
  const { dict } = await getServerDictionary();
  const [flags, bookingSettings, propertyContact] = await Promise.all([
    getModuleFlags(),
    getBookingSettings(),
    getPropertyContactInfo(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={dict.admin.nav.settings}
        description="Module activabile din UI (persistate in Supabase, fara redeploy) - variabilele de mediu NEXT_PUBLIC_MODULE_* raman valorile implicite."
      />

      <PropertyContactForm info={propertyContact} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MODULES.map((mod) => (
          <div key={mod.key} className="flex items-start justify-between gap-4 rounded-sm border border-platinum/10 bg-graphite/60 p-5">
            <div>
              <p className="font-display text-lg text-ivory">{mod.label}</p>
              <p className="mt-1 text-sm text-stone">{mod.description}</p>
            </div>
            <ModuleToggle moduleKey={mod.key} enabled={flags[mod.key]} />
          </div>
        ))}
      </div>

      <BookingSettingsForm settings={bookingSettings} />

      <div className="rounded-sm border border-platinum/10 bg-graphite/60 p-6 text-sm text-stone">
        <p className="text-ivory">Proprietate: {propertyContact.name}</p>
        <p className="mt-1">Check-in {propertyContact.checkIn} · Check-out {propertyContact.checkOut} · Moneda {siteConfig.currency}</p>
      </div>
    </div>
  );
}
