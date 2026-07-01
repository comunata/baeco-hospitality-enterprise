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

export function buildDestinationAnswer(question: string, locale: Locale) {
  const q = norm(question);
  const routes = chooseRoutes(question).slice(0, /(3 zile|trei zile|3 days|weekend|itinerar|plan)/.test(q) ? 3 : 2);

  if (/(restaurant|manc|mânc|eat|pranz|prânz|cina|cină|food)/.test(q)) {
    const food = destinationPlaces.filter((p) => p.category === "restaurant");
    return {
      answer: [
        line(locale, `Pentru gastronomie locală în zona ${destinationBase.name}, recomand:`, `For local food around ${destinationBase.name}, I recommend:`),
        ...food.map((p) => `• ${p.name[locale] ?? p.name.en} — ${p.description[locale] ?? p.description.en} (${p.distanceKm} km, ${p.driveMinutes} min).`),
      ].join("\n"),
      routes: [],
      places: food,
    };
  }

  const answerParts: string[] = [
    line(
      locale,
      `Am pregătit un plan AI pentru ${destinationBase.name}, optimizat din Gura Humorului ca punct central.`,
      `I prepared an AI plan for ${destinationBase.name}, optimized from Gura Humorului as the central base.`
    ),
  ];

  if (/(ploua|ploaie|rain|vreme rea|bad weather)/.test(q)) {
    answerParts.push(line(locale, "Dacă plouă, mutăm accentul pe obiective indoor: mănăstiri, muzee, Cetatea Sucevei, Muzeul Satului și SPA Ariniș.", "If it rains, the plan shifts to indoor-friendly places: monasteries, museums, Suceava Fortress, Bucovina Village Museum and Ariniș SPA."));
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
