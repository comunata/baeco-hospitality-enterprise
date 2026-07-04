import { buildDestinationCards } from "@/lib/destination-planner";
import { getPropertyContactInfo } from "@/lib/data/property";
import { destinationBase } from "@/lib/data/destination";
import type { Locale } from "@/lib/i18n/config";

export async function DestinationExpertPanel({ locale }: { locale: Locale }) {
  const cards = buildDestinationCards(locale).slice(0, 3);
  const contact = await getPropertyContactInfo();
  const areaLabel = contact.areaLabel || destinationBase.name;
  const isRo = locale === "ro";

  return (
    <div className="overflow-hidden rounded-sm border border-champagne/20 bg-gradient-to-br from-graphite via-midnight to-graphite p-6 shadow-2xl shadow-champagne/10 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-champagne">AI Destination Expert</p>
          <h2 className="mt-2 font-display text-3xl text-ivory md:text-4xl">{areaLabel}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone">
            {isRo
              ? "Itinerar vizual pentru 3 zile: obiective turistice, natură, gastronomie locală și rute Google Maps pregătite pentru oaspeți."
              : "A visual 3-day itinerary: local attractions, nature, local food and Google Maps routes ready for guests."}
          </p>
        </div>
        <span className="w-fit rounded-full border border-emerald/30 bg-emerald/10 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-emerald">
          {isRo ? "cultură · familie · vreme · trasee" : "culture · family · weather · routes"}
        </span>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-3">
        {cards.map((route) => (
          <article key={route.id} className="flex min-h-full flex-col rounded-sm border border-platinum/10 bg-midnight/55 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl text-ivory">{route.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone">{route.focus}</p>
              </div>
              <span className="shrink-0 rounded-full border border-champagne/25 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-champagne">
                {route.weather === "rainy" ? (isRo ? "ploaie" : "rain") : route.weather === "sunny" ? (isRo ? "soare" : "sun") : (isRo ? "flex" : "flex")}
              </span>
            </div>

            <div className="mt-5 flex-1 space-y-4">
              {route.stops.slice(0, 4).map((stop, stopIndex) => (
                <div
                  key={`${route.id}-${stop.time}-${stop.name}`}
                  className="flex gap-3 rounded-sm border border-platinum/10 border-l-2 border-l-champagne/50 bg-graphite/45 p-4 transition-colors duration-300 hover:border-l-champagne hover:bg-graphite/70"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-champagne/30 bg-midnight/60 text-[11px] font-semibold text-champagne">
                    {stopIndex + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-ivory">
                        <span className="rounded-full bg-champagne/15 px-2 py-0.5 text-xs font-semibold tracking-wide text-champagne">{stop.time}</span>{" "}
                        <span className="ml-1">{stop.name}</span>
                      </p>
                      <a
                        href={stop.mapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-emerald/30 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald transition-all duration-300 hover:bg-emerald/10 hover:shadow-[0_0_14px_rgba(14,94,85,0.3)] active:scale-95"
                      >
                        {isRo ? "Hartă" : "Map"}
                      </a>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-stone">{stop.note} · {stop.distanceKm} km / {stop.driveMinutes} min</p>
                  </div>
                </div>
              ))}
            </div>

            <a href={route.routeLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-fit rounded-sm bg-champagne px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-midnight transition hover:brightness-110">
              {isRo ? "Deschide ruta completă" : "Open full route"}
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
