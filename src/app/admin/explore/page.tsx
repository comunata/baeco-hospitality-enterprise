import { getServerDictionary } from "@/lib/i18n/server";
import { getAttractions, getLocalEvents } from "@/lib/data/explore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";

export default async function AdminExplorePage() {
  const { dict } = await getServerDictionary();
  const [attractions, events] = await Promise.all([getAttractions(), getLocalEvents()]);

  const byCategory = attractions.reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.explore} description="Gestionează conținutul Explore Area din secțiunile Restaurante, Atracții și Evenimente." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(byCategory).map(([category, count]) => (
          <StatCard key={category} label={category} value={String(count)} />
        ))}
        <StatCard label={dict.admin.nav.events} value={String(events.length)} />
      </div>
    </div>
  );
}
