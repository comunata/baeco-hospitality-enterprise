import { getServerDictionary } from "@/lib/i18n/server";
import { getAllBookings } from "@/lib/data/bookings";
import { getRooms } from "@/lib/data/rooms";
import { getRoomBlocks, isDateBlocked } from "@/lib/data/availability";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatDate, cn } from "@/lib/utils";
import { BlockForm } from "./BlockForm";
import { DeleteBlockButton } from "./DeleteBlockButton";

const HORIZON_DAYS = 14;

export default async function AdminCalendarPage() {
  const { dict } = await getServerDictionary();
  const [bookings, rooms, blocks] = await Promise.all([getAllBookings(), getRooms(), getRoomBlocks()]);
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");

  const days = Array.from({ length: HORIZON_DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  function isOccupied(roomId: string, day: string) {
    return activeBookings.some((b) => b.roomId === roomId && b.checkIn <= day && b.checkOut > day);
  }

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.calendar} description={`Următoarele ${HORIZON_DAYS} zile. Galben = rezervare, roșu = blocaj manual (mentenanță/închidere).`} />

      <BlockForm rooms={rooms} />

      <div className="overflow-x-auto rounded-sm border border-platinum/10">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-platinum/10 bg-graphite/60">
              <th className="sticky left-0 bg-graphite/60 px-3 py-2 text-left text-[11px] uppercase tracking-widest text-stone">Cameră</th>
              {days.map((day) => (
                <th key={day} className="px-2 py-2 text-center font-normal text-stone">
                  {new Date(day).getDate()}
                  <br />
                  <span className="text-[9px]">{new Date(day).toLocaleDateString("ro-RO", { month: "short" })}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-platinum/5">
                <td className="sticky left-0 bg-midnight px-3 py-2 text-ivory">{room.name.ro}</td>
                {days.map((day) => {
                  const occupied = isOccupied(room.id, day);
                  const blocked = isDateBlocked(blocks, room.id, day);
                  return (
                    <td key={day} className="px-1 py-2 text-center">
                      <span
                        className={cn(
                          "mx-auto block h-5 w-5 rounded-sm",
                          blocked ? "bg-red-400/70" : occupied ? "bg-champagne/70" : "bg-platinum/10"
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-ivory">Blocaje active</h2>
        <div className="mt-4 space-y-2">
          {blocks.length === 0 && <p className="text-sm text-stone">Niciun blocaj manual configurat.</p>}
          {blocks.map((block) => {
            const room = rooms.find((r) => r.id === block.roomId);
            return (
              <div key={block.id} className="flex items-center justify-between rounded-sm border border-platinum/10 bg-graphite/40 px-4 py-3 text-sm">
                <div>
                  <span className="text-ivory">{room?.name.ro ?? "—"}</span>
                  <span className="mx-2 text-stone">·</span>
                  <span className="text-champagne">
                    {formatDate(block.startDate)} – {formatDate(block.endDate)}
                  </span>
                  {block.reason && <span className="ml-2 text-stone">({block.reason})</span>}
                </div>
                <DeleteBlockButton id={block.id} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
