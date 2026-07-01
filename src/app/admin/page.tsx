import { getServerDictionary } from "@/lib/i18n/server";
import { getAllBookings } from "@/lib/data/bookings";
import { getRooms } from "@/lib/data/rooms";
import { getServices } from "@/lib/data/services";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const { dict } = await getServerDictionary();
  const [bookings, rooms, services] = await Promise.all([getAllBookings(), getRooms(), getServices()]);

  const today = new Date().toISOString().slice(0, 10);
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");

  const todayBookings = activeBookings.filter((b) => b.checkIn <= today && b.checkOut > today);
  const occupiedRoomIds = new Set(todayBookings.map((b) => b.roomId));
  const occupancyRate = rooms.length ? Math.round((occupiedRoomIds.size / rooms.length) * 100) : 0;
  const freeRooms = rooms.length - occupiedRoomIds.size;

  const checkInsToday = activeBookings.filter((b) => b.checkIn === today);
  const checkOutsToday = activeBookings.filter((b) => b.checkOut === today);

  const currentMonth = today.slice(0, 7);
  const revenueToday = activeBookings
    .filter((b) => b.createdAt.slice(0, 10) === today)
    .reduce((sum, b) => sum + b.totals.total, 0);
  const revenueThisMonth = activeBookings
    .filter((b) => b.createdAt.slice(0, 7) === currentMonth)
    .reduce((sum, b) => sum + b.totals.total, 0);

  const upcomingRevenue = activeBookings
    .filter((b) => b.checkIn >= today)
    .reduce((sum, b) => sum + b.totals.total, 0);

  const serviceUsage = new Map<string, number>();
  for (const booking of activeBookings) {
    for (const extra of booking.extras) {
      serviceUsage.set(extra.serviceId, (serviceUsage.get(extra.serviceId) ?? 0) + extra.quantity);
    }
  }
  const popularServices = [...serviceUsage.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([serviceId, count]) => ({ service: services.find((s) => s.id === serviceId), count }))
    .filter((entry) => entry.service);

  const sourceCounts = new Map<string, number>();
  for (const booking of activeBookings) sourceCounts.set(booking.source, (sourceCounts.get(booking.source) ?? 0) + 1);

  const roomBookingCounts = new Map<string, number>();
  for (const booking of activeBookings) roomBookingCounts.set(booking.roomId, (roomBookingCounts.get(booking.roomId) ?? 0) + 1);
  const bestSellingRoom = [...roomBookingCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestSellingRoomName = bestSellingRoom ? rooms.find((r) => r.id === bestSellingRoom[0])?.name.ro : undefined;

  const leastUsedService = services
    .map((s) => ({ service: s, count: serviceUsage.get(s.id) ?? 0 }))
    .sort((a, b) => a.count - b.count)[0];

  const recommendations = [
    occupancyRate < 40 ? `Ocupare scăzută azi (${occupancyRate}%) — ia în calcul o ofertă flash pentru zilele următoare.` : null,
    bestSellingRoomName ? `${bestSellingRoomName} este camera cu cele mai multe rezervări active.` : null,
    leastUsedService && leastUsedService.count === 0 ? `Serviciul „${leastUsedService.service.name.ro}" este rar selectat — ia în calcul promovarea lui pe pagina camerei.` : null,
  ].filter((r): r is string => Boolean(r));

  return (
    <div>
      <AdminPageHeader title={dict.admin.dashboard.title} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Venit azi" value={formatCurrency(revenueToday)} />
        <StatCard label="Venit luna curentă" value={formatCurrency(revenueThisMonth)} />
        <StatCard label={dict.admin.dashboard.occupancy} value={`${occupancyRate}%`} />
        <StatCard label={dict.admin.dashboard.freeRooms} value={String(freeRooms)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={dict.admin.dashboard.todayBookings} value={String(todayBookings.length)} />
        <StatCard label="Venit viitor (rezervări confirmate)" value={formatCurrency(upcomingRevenue)} />
        <StatCard label="Check-in azi" value={String(checkInsToday.length)} />
        <StatCard label="Check-out azi" value={String(checkOutsToday.length)} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-sm border border-platinum/10 bg-graphite/60 p-6">
          <h2 className="font-display text-xl text-ivory">Check-in azi</h2>
          <ul className="mt-4 space-y-3">
            {checkInsToday.length === 0 && <li className="text-sm text-stone">Niciun check-in azi.</li>}
            {checkInsToday.map((b) => {
              const room = rooms.find((r) => r.id === b.roomId);
              return (
                <li key={b.id} className="flex justify-between text-sm">
                  <span className="text-ivory">
                    {b.guest.firstName} {b.guest.lastName}
                  </span>
                  <span className="text-champagne">{room?.name.ro ?? "—"}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-sm border border-platinum/10 bg-graphite/60 p-6">
          <h2 className="font-display text-xl text-ivory">Check-out azi</h2>
          <ul className="mt-4 space-y-3">
            {checkOutsToday.length === 0 && <li className="text-sm text-stone">Niciun check-out azi.</li>}
            {checkOutsToday.map((b) => {
              const room = rooms.find((r) => r.id === b.roomId);
              return (
                <li key={b.id} className="flex justify-between text-sm">
                  <span className="text-ivory">
                    {b.guest.firstName} {b.guest.lastName}
                  </span>
                  <span className="text-champagne">{room?.name.ro ?? "—"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-sm border border-platinum/10 bg-graphite/60 p-6">
          <h2 className="font-display text-xl text-ivory">{dict.admin.dashboard.popularServices}</h2>
          <ul className="mt-4 space-y-3">
            {popularServices.length === 0 && <li className="text-sm text-stone">—</li>}
            {popularServices.map(({ service, count }) => (
              <li key={service!.id} className="flex justify-between text-sm">
                <span className="text-ivory">{service!.name.ro}</span>
                <span className="text-champagne">{count}×</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-sm border border-platinum/10 bg-graphite/60 p-6">
          <h2 className="font-display text-xl text-ivory">{dict.admin.dashboard.bookingSources}</h2>
          <ul className="mt-4 space-y-3">
            {[...sourceCounts.entries()].map(([source, count]) => (
              <li key={source} className="flex justify-between text-sm">
                <span className="capitalize text-ivory">{source}</span>
                <span className="text-champagne">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-sm border border-champagne/30 bg-graphite/60 p-6">
        <h2 className="font-display text-xl text-ivory">{dict.admin.dashboard.aiRecommendations}</h2>
        <ul className="mt-4 space-y-2 text-sm text-stone">
          {recommendations.length === 0 && <li>Totul arată bine — nicio recomandare urgentă azi.</li>}
          {recommendations.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-champagne">—</span> {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
