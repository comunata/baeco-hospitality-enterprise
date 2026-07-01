import "server-only";
import { buildOverpassQuery, runOverpassQuery, elementCoords } from "./overpass";
import { classifyOsmTags } from "./taxonomy";
import { scoreOsmTags, haversineKm, estimateDriveMinutes } from "./scoring";
import { sampleScanResults } from "./sample-data";
import { BD_CATEGORIES, type BdCategory, type PlaceCandidate } from "./types";

export interface ScanInput {
  lat: number;
  lng: number;
  radiusKm: number;
  categories?: BdCategory[];
}

export interface ScanOutput {
  candidates: PlaceCandidate[];
  /** 'osm' when the live API responded, 'sample' when we fell back offline. */
  source: "osm" | "sample";
}

/**
 * Runs one discovery scan around the property. Purely deterministic — one
 * Overpass request, classification and scoring in-process, zero AI calls.
 * Falls back to the bundled sample dataset when the live API is unreachable
 * so the product remains fully demonstrable offline.
 */
export async function runDiscoveryScan(input: ScanInput): Promise<ScanOutput> {
  const categories = input.categories?.length ? input.categories : [...BD_CATEGORIES];

  const query = buildOverpassQuery(input.lat, input.lng, input.radiusKm, categories);
  const elements = await runOverpassQuery(query);

  if (elements === null) {
    return { candidates: sampleScanResults(input.lat, input.lng, input.radiusKm), source: "sample" };
  }

  const wanted = new Set(categories);
  const seen = new Set<string>();
  const candidates: PlaceCandidate[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name) continue; // unnamed POIs are noise for a hospitality guide

    const rule = classifyOsmTags(tags);
    if (!rule || !wanted.has(rule.category)) continue;

    const coords = elementCoords(el);
    if (!coords) continue;

    const sourceRef = `${el.type}/${el.id}`;
    if (seen.has(sourceRef)) continue;
    seen.add(sourceRef);

    const distanceKm = Math.round(haversineKm(input.lat, input.lng, coords.lat, coords.lng) * 10) / 10;
    if (distanceKm > input.radiusKm) continue;

    const address = [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]].filter(Boolean).join(" ");

    candidates.push({
      source: "osm",
      sourceRef,
      name,
      nameEn: tags["name:en"],
      category: rule.category,
      subcategory: rule.value ?? tags[rule.key],
      description: {
        ro: tags["description:ro"] ?? tags.description ?? "",
        en: tags["description:en"] ?? tags.description ?? "",
      },
      tags: (tags.cuisine ? tags.cuisine.split(";") : []).map((t) => t.trim()).filter(Boolean),
      goodFor: rule.goodFor,
      lat: coords.lat,
      lng: coords.lng,
      distanceKm,
      driveMinutes: estimateDriveMinutes(distanceKm),
      address: address || undefined,
      phone: tags.phone ?? tags["contact:phone"],
      website: tags.website ?? tags["contact:website"],
      openingHours: tags.opening_hours,
      image: tags.image,
      qualityScore: scoreOsmTags(tags),
    });
  }

  // Best candidates first — the review queue starts with what matters.
  candidates.sort((a, b) => b.qualityScore - a.qualityScore || a.distanceKm - b.distanceKm);
  return { candidates, source: "osm" };
}

export function googleMapsPlaceLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
