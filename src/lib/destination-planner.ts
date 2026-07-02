import type { Locale } from "@/lib/i18n/config";
import { destinationBase, destinationPlaces, destinationRoutes, getPlaceById, googleMapsLink, googleMapsRouteLink } from "@/lib/data/destination";

function norm(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function line(locale: Locale, ro: string, en: string) {
  return locale === "ro" ? ro : en;
}

function chooseRoutes(question: string) {
  const q = norm(question);
  if (/(ploua|ploaie|rain|vreme rea|bad weather)/.test(q)) return destinationRoutes.filter((r) => r.weather === "rainy" || r.weather === "any");
  if (/(copii|copil|famil|kids|children)/.test(q)) return destinationRoutes.filter((r) => r.bestFor.includes("family"));
  if (/(putna|ritm alert|istorie multa|history)/.test(q)) return destinationRoutes.filter((r) => r.id === "northwest-alert-putna" || r.id === "east-history-suceava");
  if (/(relax|spa|odihna|ușor|usor)/.test(q)) return destinationRoutes.filter((r) => r.bestFor.includes("relax") || r.id === "west-unesco-adventure");
  if (/(3 zile|trei zile|3 days|weekend|itinerar|plan)/.test(q)) return [destinationRoutes[0], destinationRoutes[1], destinationRoutes[3]];
  return [destinationRoutes[0], destinationRoutes[1], destinationRoutes[3]];
}

export function buildDestinationAnswer(question: string, locale: Locale, areaLabel?: string) {
  const q = norm(question);
  const routes = chooseRoutes(question).slice(0, /(3 zile|trei zile|3 days|weekend|itinerar|plan)/.test(q) ? 3 : 2);
  const label = areaLabel || destinationBase.name;

  if (/(restaurant|manc|mânc|eat|pranz|prânz|cina|cină|food)/.test(q)) {
    const food = destinationPlaces.filter((p) => p.category === "restaurant");
    return {
      answer: [
        line(locale, `Pentru gastronomie locală în zona ${label}, recomand:`, `For local food around ${label}, I recommend:`),
        ...food.map((p) => `• ${p.name[locale] ?? p.name.en} — ${p.description[locale] ?? p.description.en} (${p.distanceKm} km, ${p.driveMinutes} min).`),
      ].join("\n"),
      routes: [],
      places: food,
    };
  }

  const answerParts: string[] = [
    line(locale, `Am pregătit un plan AI pentru zona ${label}.`, `I prepared an AI plan for the ${label} area.`),
  ];

  if (/(ploua|ploaie|rain|vreme rea|bad weather)/.test(q)) {
    answerParts.push(line(locale, "Dacă plouă, mutăm accentul pe obiective indoor: muzee, atracții culturale și SPA.", "If it rains, the plan shifts to indoor-friendly places: museums, cultural attractions and the SPA."));
  }

  routes.forEach((route, index) => {
    answerParts.push(`\n${index + 1}. ${route.title[locale] ?? route.title.en}`);
    answerParts.push(route.focus[locale] ?? route.focus.en);
    route.stops.forEach((stop) => {
      const p = getPlaceById(stop.placeId);
      if (!p) return;
      answerParts.push(`   ${stop.time} — ${p.name[locale] ?? p.name.en} (${p.distanceKm} km / ${p.driveMinutes} min): ${stop.note[locale] ?? stop.note.en}`);
      if (p.reservationNote) answerParts.push(`      ${p.reservationNote[locale] ?? p.reservationNote.en}`);
    });
    answerParts.push(line(locale, "   Ruta este disponibilă prin butonul dedicat din card.", "   The route is available through the dedicated button in the card."));
  });

  answerParts.push(line(locale, "Pot adapta planul pentru familie cu copii, cuplu, ritm relaxat, aventură sau ploaie.", "I can adapt the plan for families with children, couples, relaxed pace, adventure or rain."));

  return { answer: answerParts.join("\n"), routes, places: destinationPlaces };
}

/**
 * Rules-only (no OpenAI, no approved Discovery Engine knowledge) answer for
 * a property whose configured location isn't the curated Bucovina seed data
 * above. It stays honest — no invented place names — while still giving the
 * guest a useful structure instead of a bare "no information" reply.
 */
export function buildGenericAreaAnswer(question: string, locale: Locale, areaLabel: string) {
  const q = norm(question);
  const isRain = /(ploua|ploaie|rain|vreme rea|bad weather)/.test(q);
  const isFood = /(restaurant|manc|mânc|eat|pranz|prânz|cina|cină|food)/.test(q);
  const isKids = /(copii|copil|famil|kids|children)/.test(q);

  if (isFood) {
    return line(
      locale,
      `Recepția are cele mai actualizate recomandări de restaurante din ${areaLabel}. Îți pot sugera și eu un plan general: un local central pentru prânz și o terasă sau restaurant cu specific local pentru cină — cere-i recepției adresele exacte la check-in.`,
      `Reception has the most up-to-date restaurant recommendations in ${areaLabel}. I can also suggest a general plan: a central spot for lunch and a terrace or local-specialty restaurant for dinner — ask reception for exact addresses at check-in.`
    );
  }

  const parts = [
    line(
      locale,
      `Nu avem încă un ghid local aprobat pentru ${areaLabel} în platformă, dar te pot ajuta cu un plan general.`,
      `We don't have an approved local guide for ${areaLabel} in the platform yet, but I can help with a general plan.`
    ),
    isRain
      ? line(locale, `Pe vreme de ploaie: muzee, atracții indoor și SPA din ${areaLabel} sunt alegeri sigure.`, `On a rainy day: museums, indoor attractions and the SPA in ${areaLabel} are safe choices.`)
      : isKids
        ? line(locale, `Cu copii: caută parcuri, atracții outdoor și locuri de joacă apropiate din ${areaLabel}.`, `With kids: look for parks, outdoor attractions and playgrounds nearby in ${areaLabel}.`)
        : line(
            locale,
            `De obicei, o zi bună în ${areaLabel} arată așa: dimineața explorezi centrul și obiectivele apropiate, la prânz o pauză la un restaurant local, iar după-amiaza o activitate în aer liber sau relaxare.`,
            `A good day in ${areaLabel} usually looks like this: mornings for the center and nearby attractions, a local restaurant for lunch, and an outdoor activity or relaxation in the afternoon.`
          ),
    line(locale, "Pentru nume și adrese exacte, recepția are cele mai actuale informații locale.", "For exact names and addresses, reception has the most current local information."),
  ];

  return parts.join("\n");
}

export function buildDestinationCards(locale: Locale) {
  return destinationRoutes.map((route) => {
    const stops = route.stops.map((stop) => ({ ...stop, place: getPlaceById(stop.placeId) })).filter((s) => s.place);
    const routeLink = googleMapsRouteLink(stops.map((s) => s.place!.mapsQuery));
    return {
      id: route.id,
      title: route.title[locale] ?? route.title.en,
      focus: route.focus[locale] ?? route.focus.en,
      weather: route.weather,
      routeLink,
      stops: stops.map((s) => ({
        time: s.time,
        note: s.note[locale] ?? s.note.en,
        name: s.place!.name[locale] ?? s.place!.name.en,
        distanceKm: s.place!.distanceKm,
        driveMinutes: s.place!.driveMinutes,
        mapsLink: googleMapsLink(s.place!.mapsQuery),
      })),
    };
  });
}
