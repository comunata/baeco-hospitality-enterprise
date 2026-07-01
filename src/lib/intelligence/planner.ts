import "server-only";
import type { Locale } from "@/lib/i18n/config";
import { getApprovedPlaces, getPropertyProfile } from "@/lib/data/discovery";
import { CATEGORY_LABELS, type BdCategory, type DiscoveredPlace, type Persona } from "@/lib/discovery/types";

/**
 * Intelligence layer: turns the approved knowledge base into guest-facing
 * experiences — day itineraries (1/2/3/5/7 days), persona plans (family,
 * romantic, kids, rainy day), dining/evening picks and a compact context
 * block for the AI agents.
 *
 * Everything here is deterministic and free: it reads the approved places
 * once and slots them by category, persona fit, quality score, pin status
 * and distance. The (paid) AI model is only needed on top of this, for
 * natural-language phrasing — never for the facts.
 */

export type ItineraryDays = 1 | 2 | 3 | 5 | 7;

export interface ItineraryStop {
  time: string;
  place: DiscoveredPlace;
  note: { ro: string; en: string };
}

export interface ItineraryDay {
  day: number;
  title: { ro: string; en: string };
  stops: ItineraryStop[];
}

export interface StayPlan {
  days: ItineraryDay[];
  persona?: Persona;
}

const MORNING_CATEGORIES: BdCategory[] = ["culture", "attraction", "family"];
const AFTERNOON_CATEGORIES: BdCategory[] = ["nature", "trail", "adventure", "sport", "family", "attraction"];
const RAINY_CATEGORIES: BdCategory[] = ["culture", "wellness", "shopping", "family"];
const EVENING_CATEGORIES: BdCategory[] = ["bar", "nightlife", "restaurant"];

function rank(place: DiscoveredPlace, persona?: Persona): number {
  let score = place.qualityScore;
  if (place.pinned) score += 100; // admin-pinned always wins its slot
  if (persona && place.goodFor.includes(persona)) score += 40;
  score -= Math.min(30, place.distanceKm); // prefer closer, capped
  return score;
}

function pick(pool: DiscoveredPlace[], categories: BdCategory[], used: Set<string>, persona?: Persona): DiscoveredPlace | undefined {
  const candidates = pool
    .filter((p) => categories.includes(p.category) && !used.has(p.id))
    .sort((a, b) => rank(b, persona) - rank(a, persona));
  const chosen = candidates[0];
  if (chosen) used.add(chosen.id);
  return chosen;
}

function dayTitle(day: number, focus: DiscoveredPlace | undefined): { ro: string; en: string } {
  const focusName = focus ? ` — ${focus.name}` : "";
  return { ro: `Ziua ${day}${focusName}`, en: `Day ${day}${focusName}` };
}

/**
 * Builds a multi-day plan from the approved places. Each day: morning
 * highlight → lunch → afternoon activity → optional evening. On `rainy-day`
 * persona the slots shift to indoor-friendly categories.
 */
export async function buildStayPlan(days: ItineraryDays, persona?: Persona): Promise<StayPlan> {
  const approved = await getApprovedPlaces();
  const experiencePool = approved.filter((p) => !["transport", "health", "fuel", "services"].includes(p.category));
  const used = new Set<string>();
  const result: ItineraryDay[] = [];
  const rainy = persona === "rainy-day";

  for (let day = 1; day <= days; day++) {
    const stops: ItineraryStop[] = [];

    const morning = pick(experiencePool, rainy ? RAINY_CATEGORIES : MORNING_CATEGORIES, used, persona);
    if (morning) stops.push({ time: "09:30", place: morning, note: { ro: "Vizită de dimineață, înainte de aglomerație.", en: "Morning visit, before the crowds." } });

    const lunch = pick(experiencePool, ["restaurant"], used, persona);
    if (lunch) stops.push({ time: "13:00", place: lunch, note: { ro: "Prânz local.", en: "Local lunch." } });

    const afternoon = pick(experiencePool, rainy ? RAINY_CATEGORIES : AFTERNOON_CATEGORIES, used, persona);
    if (afternoon) stops.push({ time: "15:30", place: afternoon, note: { ro: "Activitatea de după-amiază.", en: "Afternoon activity." } });

    if (persona === "romantic" || persona === "evening" || days <= 3) {
      const evening = pick(experiencePool, EVENING_CATEGORIES, used, persona ?? "evening");
      if (evening) stops.push({ time: "19:30", place: evening, note: { ro: "Seara: cină sau un pahar în oraș.", en: "Evening: dinner or drinks in town." } });
    }

    if (stops.length === 0) break; // knowledge base exhausted
    result.push({ day, title: dayTitle(day, stops[0]?.place), stops });
  }

  return { days: result, persona };
}

/** Top dining picks (restaurants first, then cafes/bars), pinned & scored. */
export async function buildDiningGuide(limit = 6): Promise<DiscoveredPlace[]> {
  const approved = await getApprovedPlaces();
  return approved
    .filter((p) => ["restaurant", "cafe", "bar"].includes(p.category))
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, limit);
}

/** Persona-filtered recommendations ("cu copiii", "dacă plouă", "romantic"). */
export async function buildPersonaGuide(persona: Persona, limit = 8): Promise<DiscoveredPlace[]> {
  const approved = await getApprovedPlaces();
  return approved
    .filter((p) => p.goodFor.includes(persona))
    .sort((a, b) => rank(b, persona) - rank(a, persona))
    .slice(0, limit);
}

/**
 * Compact, factual context block for the AI agents (Concierge, Local Guide,
 * Receptionist…): the approved knowledge base serialized in a few hundred
 * tokens. Agents answer from this — they never invent places.
 */
export async function buildAiAreaContext(locale: Locale): Promise<string> {
  const [profile, approved] = await Promise.all([getPropertyProfile(), getApprovedPlaces()]);
  if (approved.length === 0) return "";

  const byCategory = new Map<BdCategory, DiscoveredPlace[]>();
  for (const place of approved) {
    const list = byCategory.get(place.category) ?? [];
    list.push(place);
    byCategory.set(place.category, list);
  }

  const lines: string[] = [
    locale === "ro"
      ? `Locuri aprobate în jurul proprietății ${profile.name} (${profile.locality ?? profile.address}):`
      : `Approved places around ${profile.name} (${profile.locality ?? profile.address}):`,
  ];
  for (const [category, places] of byCategory) {
    const label = CATEGORY_LABELS[category][locale === "ro" ? "ro" : "en"];
    const items = places
      .slice(0, 6)
      .map((p) => `${p.name} (${p.distanceKm} km${p.openingHours ? `, ${p.openingHours}` : ""})`)
      .join("; ");
    lines.push(`- ${label}: ${items}`);
  }
  return lines.join("\n");
}

/** True when the engine has an approved knowledge base to work from. */
export async function hasApprovedKnowledge(): Promise<boolean> {
  const approved = await getApprovedPlaces();
  return approved.length > 0;
}
