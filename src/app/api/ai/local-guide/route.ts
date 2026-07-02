import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { isModuleEnabledRuntime } from "@/lib/data/settings";
import { buildDestinationAnswer, buildDestinationCards, buildGenericAreaAnswer } from "@/lib/destination-planner";
import { destinationBase, destinationPlaces } from "@/lib/data/destination";
import { buildStayPlan, buildDiningGuide, buildPersonaGuide, buildAiAreaContext, hasApprovedKnowledge, type ItineraryDays, type StayPlan } from "@/lib/intelligence/planner";
import { googleMapsPlaceLink } from "@/lib/discovery/engine";
import { completeChatDetailed, isAiConfigured, type AiFailureReason } from "@/lib/integrations/ai";
import { getPropertyContactInfo } from "@/lib/data/property";
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

/**
 * Grounding facts for the LLM: the admin-approved knowledge base when it
 * exists, otherwise the curated destination seed data (only valid while the
 * property's configured location is still the seed's default area — Gura
 * Humorului/Bucovina). For any other admin-configured location without an
 * approved knowledge base yet, we hand the model an honest, location-aware
 * instruction instead of unrelated Bucovina place names — it never invents
 * places.
 */
async function buildGroundingFacts(locale: Locale, areaLabel: string, isDefaultArea: boolean): Promise<string> {
  const approved = await buildAiAreaContext(locale);
  if (approved) return approved;
  if (isDefaultArea) {
    const lang = locale === "ro" ? "ro" : "en";
    const lines = destinationPlaces.map(
      (p) => `- ${p.name[lang] ?? p.name.en} (${p.distanceKm} km / ${p.driveMinutes} min, ~${p.visitMinutes} min visit): ${p.description[lang] ?? p.description.en}`
    );
    return `${areaLabel}:\n${lines.join("\n")}`;
  }
  return locale === "ro"
    ? `Proprietatea este situată în ${areaLabel}. Nu există încă un ghid local aprobat pentru această zonă. Fii util și oferă sfaturi generale de vizitare (obiective centrale, tipuri de restaurante, activități pentru familii, ce faci pe vreme de ploaie) fără să inventezi nume de locuri, adrese sau programe specifice — recomandă oaspetelui să confirme detaliile exacte la recepție.`
    : `The property is located in ${areaLabel}. There is no approved local guide for this area yet. Be helpful with general visiting advice (central attractions, restaurant types, family activities, rainy-day options) without inventing specific place names, addresses or schedules — invite the guest to confirm exact details at reception.`;
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "ai-local-guide", { maxRequests: 15, windowMs: 60_000 });
  if (limited) return limited;

  if (!(await isModuleEnabledRuntime("aiLocalGuide"))) {
    return NextResponse.json({ error: "module_disabled" }, { status: 403 });
  }

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
    const [knowledgeApproved, contact] = await Promise.all([hasApprovedKnowledge(), getPropertyContactInfo()]);
    const areaLabel = contact.areaLabel || destinationBase.name;
    const normalizedLocality = normalize(`${contact.locality} ${contact.address}`);
    const isDefaultArea = !contact.locality || normalizedLocality.includes("gura humorului");
    const persona = detectPersona(q);

    // Structured itinerary cards stay deterministic (times, distances, maps
    // links) regardless of whether the LLM phrases the text answer. The
    // curated Bucovina route cards only make sense while the property is
    // still configured for that default area.
    let routeCards: ReturnType<typeof planToRouteCards> | ReturnType<typeof buildDestinationCards> | undefined;
    if (wantsCards) {
      if (knowledgeApproved) {
        const plan = await buildStayPlan(requestedDays(q), persona);
        if (plan.days.length > 0) routeCards = planToRouteCards(plan, locale).slice(0, 3);
      }
      if (!routeCards && isDefaultArea) routeCards = buildDestinationCards(locale).slice(0, isItineraryRequest ? 3 : 2);
    }

    // Preferred path: real LLM answer grounded in approved/curated facts —
    // every question gets its own answer, in natural language. When the API
    // call fails, the failure reason is surfaced as `engineReason` on the
    // deterministic fallback response (and logged server-side).
    let engineReason: AiFailureReason | undefined;
    if (await isAiConfigured()) {
      const facts = await buildGroundingFacts(locale, areaLabel, isDefaultArea);
      const result = await completeChatDetailed([
        {
          role: "system",
          content:
            `You are the AI Local Guide of ${dict.common.brand}, a premium hospitality property located in ${areaLabel}. ` +
            `Answer the guest's question directly and specifically, in ${locale === "ro" ? "Romanian" : "English"}, in a warm, concierge tone. Always give a useful answer — never reply with a bare "no information" message. ` +
            `Recommend ONLY places from the facts below (with distances/times when useful). Never invent places, prices or schedules not present in the facts. ` +
            `If the facts don't name a specific place for the question, still help with general, honest guidance and suggest confirming exact details at reception.\n\nFacts:\n${facts}`,
        },
        { role: "user", content: question },
      ]);
      if (result.content) {
        return NextResponse.json({ answer: result.content, itinerary: isItineraryRequest, routeCards, engine: "openai" });
      }
      engineReason = result.reason;
    } else {
      engineReason = "no_api_key";
    }

    // Deterministic fallback (no API key / API error): intent-based answers.
    if (knowledgeApproved) {
      if (/(manc|eat|restaurant|pranz|cina|food|dinner|lunch)/.test(q)) {
        const dining = await buildDiningGuide();
        if (dining.length > 0) {
          const lines = dining.map((p) => `• ${p.name} — ${p.distanceKm} km${p.openingHours ? ` · ${p.openingHours}` : ""}${p.phone ? ` · ${p.phone}` : ""}`);
          return NextResponse.json({
            answer: [locale === "ro" ? "Recomandările noastre gastronomice din zonă:" : "Our dining recommendations in the area:", ...lines].join("\n"),
            itinerary: false,
            engine: "rules",
            engineReason,
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
            engine: "rules",
            engineReason,
          });
        }
      }
      if (isItineraryRequest && routeCards?.length) {
        return NextResponse.json({
          answer:
            locale === "ro"
              ? "Am pregătit un plan din locurile aprobate de proprietate."
              : "I prepared a plan from the property's approved places.",
          itinerary: true,
          routeCards,
          engine: "rules",
          engineReason,
        });
      }
    }

    const fallbackAnswer = isDefaultArea ? buildDestinationAnswer(question, locale, areaLabel).answer : buildGenericAreaAnswer(question, locale, areaLabel);
    return NextResponse.json({
      answer: fallbackAnswer,
      itinerary: isItineraryRequest,
      routeCards,
      engine: "rules",
      engineReason,
    });
  } catch {
    return NextResponse.json({ answer: dict.errors.generic, itinerary: false, engine: "rules" });
  }
}
