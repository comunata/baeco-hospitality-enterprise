import "server-only";
import { selectorsForCategories } from "./taxonomy";
import type { BdCategory } from "./types";

const OVERPASS_BASE = process.env.DISCOVERY_OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
const TIMEOUT_MS = 30_000;

export interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * One Overpass query per scan: the union of all category selectors within
 * `around:<radius>` of the property. `out center` collapses ways/relations
 * to a single coordinate so everything downstream works with points.
 */
export function buildOverpassQuery(lat: number, lng: number, radiusKm: number, categories: BdCategory[]): string {
  const around = `(around:${Math.round(radiusKm * 1000)},${lat},${lng})`;
  const selectors = selectorsForCategories(categories);
  const clauses = selectors.flatMap((sel) => [`nwr${sel}${around};`]);
  return `[out:json][timeout:${Math.floor(TIMEOUT_MS / 1000) - 5}];(${clauses.join("")});out center tags;`;
}

/** Runs the query. Returns null when the API is unreachable (offline/demo). */
export async function runOverpassQuery(query: string): Promise<OsmElement[] | null> {
  try {
    const res = await fetch(OVERPASS_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { elements?: OsmElement[] };
    return data.elements ?? [];
  } catch {
    return null;
  }
}

export function elementCoords(el: OsmElement): { lat: number; lng: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}
