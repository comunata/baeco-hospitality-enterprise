import { getServerDictionary } from "@/lib/i18n/server";
import { getRooms } from "@/lib/data/rooms";
import { getSeasons, getRoomRateOverrides } from "@/lib/data/seasons";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RateCell } from "./RateCell";

export default async function AdminRatesPage() {
  const { dict } = await getServerDictionary();
  const [rooms, seasons, overrides] = await Promise.all([getRooms(), getSeasons(), getRoomRateOverrides()]);

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.rates}
        description="Tarif calculat = preț de bază × multiplicator sezon × multiplicator weekend. Click pe un preț pentru a seta un tarif fix (override) pentru acea cameră + sezon; lasă gol pentru a reveni la calculul automat."
      />
      <div className="overflow-x-auto rounded-sm border border-platinum/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-platinum/10 bg-graphite/60">
              <th className="px-4 py-3 text-[11px] uppercase tracking-widest text-stone">Cameră</th>
              {seasons.map((s) => (
                <th key={s.id} className="px-4 py-3 text-[11px] uppercase tracking-widest text-stone">
                  {s.name.ro}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-platinum/5">
                <td className="px-4 py-3 text-ivory">{room.name.ro}</td>
                {seasons.map((season) => {
                  const override = overrides.find((o) => o.roomId === room.id && o.seasonId === season.id);
                  return (
                    <td key={season.id} className="px-4 py-3">
                      <RateCell
                        roomId={room.id}
                        seasonId={season.id}
                        computedPrice={room.basePrice * season.multiplier}
                        computedWeekendPrice={room.basePrice * season.multiplier * season.weekendMultiplier}
                        overridePrice={override?.overridePrice ?? null}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
