import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildDestinationAnswer, buildDestinationCards } from "@/lib/destination-planner";
import { buildStayPlan, buildDiningGuide, buildPersonaGuide, hasApprovedKnowledge, type ItineraryDays, type StayPlan } from "@/lib/intelligence/planner";
import { googleMapsPlaceLink } from "@/lib/discovery/engine";
import type { Persona } from "@/lib/discovery/types";

const requestSchema = z.object({
  question: z.string().min(1).max(1000),
  locale: z.string().optional(),
});

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function requestedDays(q: string): ItineraryDays {
  if (/(7 zile|7 days|saptamana|week)/.test(q)) return 7;
  if (/(5 zile|5 days)/.test(q)) return 5;
  if (/(2 zile|2 days|weekend)/.test(q)) return 2;
  if (/(1 zi|o zi|1 day|one day)/.test(q)) return 1;
  return 3;
}

function detectPersona(q: string): Persona | undefined {
  if (/(ploua|ploaie|rain|vreme rea)/.test(q)) return "rainy-day";
  if (/(copii|copil|kids|children)/.test(q)) return "kids";
  if (/(famil|family)/.test(q)) return "family";
  if (/(romantic|cuplu|couple)/.test(q)) return "romantic";
  if (/(seara|evening|noapte|night)/.test(q)) return "evening";
  if (/(relax|spa|odihna)/.test(q)) return "relax";
  if (/(aventura|adventure|adrenalina)/.test(q)) return "adventure";
  return undefined;
}

/** Maps a StayPlan onto the RouteCard shape the LocalGuideChat UI renders. */
function planToRouteCards(plan: StayPlan, locale: Locale) {
  return plan.days.map((day) => ({
    id: `plan-day-${day.day}`,
    title: day.title[locale === "ro" ? "ro" : "en"],
    focus: day.stops.map((s) => s.place.name).join(" · "),
    weather: plan.persona === "rainy-day" ? ("rainy" as const) : ("any" as const),
    routeLink: googleMapsPlaceLink(day.stops[0]?.place.lat ?? 0, day.stops[0]?.place.lng ?? 0),
    stops: day.stops.map((stop) => ({
      time: stop.time,
      note: stop.note[locale === "ro" ? "ro" : "en"],
      name: stop.place.name,
      distanceKm: stop.place.distanceKm,
      driveMinutes: stop.place.driveMinutes,
      mapsLink: googleMapsPlaceLink(stop.place.lat, stop.place.lng),
    })),
  }));
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "ai-local-guide", { maxRequests: 15, windowMs: 60_000 });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { question } = parsed.data;
  const locale = isLocale(parsed.data.locale ?? "") ? (parsed.data.locale as Locale) : defaultLocale;
  const dict = getDictionary(locale);
  const q = normalize(question);
  const isItineraryRequest = /(zile|days|weekend|itinerar|plan|saptamana|week)/.test(q);
  const wantsCards = isItineraryRequest || /(vizita|visit|copii|kids|ploua|rain|manc|eat|restaurant|traseu|route)/.test(q);

  try {
    // Preferred path: the Hospitality Intelligence Engine. When the admin
    // has an approved knowledge base, answers come exclusively from it —
    // the guide recommends only places the property has vetted.
    if (await hasApprovedKnowledge()) {
      const persona = detectPersona(q);

      if (/(manc|eat|restaurant|pranz|cina|food|dinner|lunch)/.test(q)) {
        const dining = await buildDiningGuide();
        if (dining.length > 0) {
          const lines = dining.map((p) => `• ${p.name} — ${p.distanceKm} km${p.openingHours ? ` · ${p.openingHours}` : ""}${p.phone ? ` · ${p.phone}` : ""}`);
          return NextResponse.json({
            answer: [locale === "ro" ? "Recomandările noastre gastronomice din zonă:" : "Our dining recommendations in the area:", ...lines].join("\n"),
            itinerary: false,
          });
        }
      }

      if (isItineraryRequest) {
        const plan = await buildStayPlan(requestedDays(q), persona);
        if (plan.days.length > 0) {
          return NextResponse.json({
            answer:
              locale === "ro"
                ? `Am pregătit un plan pe ${plan.days.length} ${plan.days.length === 1 ? "zi" : "zile"} din locurile aprobate de proprietate.`
                : `I prepared a ${plan.days.length}-day plan from the property's approved places.`,
            itinerary: true,
            routeCards: planToRouteCards(plan, locale).slice(0, 3),
          });
        }
      }

      if (persona) {
        const picks = await buildPersonaGuide(persona);
        if (picks.length > 0) {
          const lines = picks.map((p) => `• ${p.name} — ${p.distanceKm} km / ${p.driveMinutes} min`);
          return NextResponse.json({
            answer: [locale === "ro" ? "Recomandări potrivite pentru voi:" : "Recommendations suited for you:", ...lines].join("\n"),
            itinerary: false,
          });
        }
      }
    }

    // Fallback: the curated Bucovina destination planner (seed data).
    const destination = buildDestinationAnswer(question, locale);
    return NextResponse.json({
      answer: destination.answer || dict.ai.concierge.handoffText,
      itinerary: isItineraryRequest,
      routeCards: wantsCards ? buildDestinationCards(locale).slice(0, isItineraryRequest ? 3 : 2) : undefined,
    });
  } catch {
    return NextResponse.json({ answer: dict.errors.generic, itinerary: false });
  }
}
