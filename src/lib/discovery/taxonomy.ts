import type { BdCategory, Persona } from "./types";

/**
 * OSM → BD taxonomy. Each rule matches one OSM tag (key or key=value) and
 * maps it to a BD category plus default personas. Rules are evaluated in
 * order; the first match wins, so more specific rules come first.
 *
 * Classification is fully deterministic — no AI call is needed to turn a
 * raw OSM element into a categorized, persona-tagged place. The AI layer
 * is reserved for content generation and personalized recommendations.
 */
export interface TaxonomyRule {
  key: string;
  value?: string;           // undefined = any value of `key`
  category: BdCategory;
  goodFor: Persona[];
  /** Overpass selector; grouped per category to build the union query. */
  selector: string;
}

export const TAXONOMY: TaxonomyRule[] = [
  // --- culture & attractions (specific first) ---
  { key: "amenity", value: "place_of_worship", category: "culture", goodFor: ["culture", "rainy-day"], selector: '["amenity"="place_of_worship"]["tourism"]' },
  { key: "historic", value: "monastery", category: "culture", goodFor: ["culture", "family", "rainy-day"], selector: '["historic"="monastery"]' },
  { key: "historic", value: "castle", category: "culture", goodFor: ["culture", "family"], selector: '["historic"="castle"]' },
  { key: "historic", value: "fort", category: "culture", goodFor: ["culture", "family"], selector: '["historic"="fort"]' },
  { key: "tourism", value: "museum", category: "culture", goodFor: ["culture", "rainy-day", "family"], selector: '["tourism"="museum"]' },
  { key: "tourism", value: "gallery", category: "culture", goodFor: ["culture", "rainy-day"], selector: '["tourism"="gallery"]' },
  { key: "historic", category: "culture", goodFor: ["culture"], selector: '["historic"]["historic"!~"^(no|yes)$"]' },
  { key: "tourism", value: "attraction", category: "attraction", goodFor: ["family"], selector: '["tourism"="attraction"]' },
  { key: "tourism", value: "viewpoint", category: "nature", goodFor: ["romantic", "adventure"], selector: '["tourism"="viewpoint"]' },

  // --- nature & trails ---
  { key: "natural", value: "waterfall", category: "nature", goodFor: ["adventure", "romantic", "family"], selector: '["natural"="waterfall"]' },
  { key: "natural", value: "cave_entrance", category: "nature", goodFor: ["adventure", "family"], selector: '["natural"="cave_entrance"]' },
  { key: "natural", value: "peak", category: "nature", goodFor: ["adventure"], selector: '["natural"="peak"]["name"]' },
  { key: "water", value: "lake", category: "nature", goodFor: ["family", "romantic", "relax"], selector: '["water"="lake"]["name"]' },
  { key: "leisure", value: "nature_reserve", category: "nature", goodFor: ["family", "relax"], selector: '["leisure"="nature_reserve"]' },
  { key: "route", value: "hiking", category: "trail", goodFor: ["adventure", "family"], selector: '["route"="hiking"]' },
  { key: "highway", value: "via_ferrata", category: "adventure", goodFor: ["adventure"], selector: '["highway"="via_ferrata"]' },

  // --- adventure & sport ---
  { key: "sport", value: "climbing", category: "adventure", goodFor: ["adventure"], selector: '["sport"="climbing"]' },
  { key: "leisure", value: "horse_riding", category: "adventure", goodFor: ["family", "kids", "adventure"], selector: '["leisure"="horse_riding"]' },
  { key: "aerialway", category: "adventure", goodFor: ["family", "adventure"], selector: '["aerialway"~"^(gondola|chair_lift|cable_car|zip_line)$"]' },
  { key: "piste:type", category: "sport", goodFor: ["adventure", "family"], selector: '["piste:type"]["name"]' },
  { key: "leisure", value: "sports_centre", category: "sport", goodFor: ["family"], selector: '["leisure"="sports_centre"]' },
  { key: "leisure", value: "pitch", category: "sport", goodFor: ["family", "kids"], selector: '["leisure"="pitch"]["name"]' },
  { key: "sport", value: "cycling", category: "sport", goodFor: ["adventure", "family"], selector: '["sport"="cycling"]' },

  // --- wellness ---
  { key: "leisure", value: "spa", category: "wellness", goodFor: ["romantic", "relax", "rainy-day"], selector: '["leisure"="spa"]' },
  { key: "amenity", value: "spa", category: "wellness", goodFor: ["romantic", "relax", "rainy-day"], selector: '["amenity"="spa"]' },
  { key: "leisure", value: "swimming_pool", category: "wellness", goodFor: ["family", "kids", "relax"], selector: '["leisure"="swimming_pool"]["name"]' },
  { key: "leisure", value: "sauna", category: "wellness", goodFor: ["relax", "rainy-day"], selector: '["leisure"="sauna"]' },

  // --- family ---
  { key: "leisure", value: "water_park", category: "family", goodFor: ["family", "kids"], selector: '["leisure"="water_park"]' },
  { key: "tourism", value: "zoo", category: "family", goodFor: ["family", "kids"], selector: '["tourism"="zoo"]' },
  { key: "tourism", value: "theme_park", category: "family", goodFor: ["family", "kids"], selector: '["tourism"="theme_park"]' },
  { key: "leisure", value: "playground", category: "family", goodFor: ["kids"], selector: '["leisure"="playground"]["name"]' },
  { key: "leisure", value: "park", category: "family", goodFor: ["family", "kids", "relax"], selector: '["leisure"="park"]["name"]' },

  // --- food & drink ---
  { key: "amenity", value: "restaurant", category: "restaurant", goodFor: ["family", "romantic", "evening"], selector: '["amenity"="restaurant"]' },
  { key: "amenity", value: "fast_food", category: "restaurant", goodFor: ["family", "kids"], selector: '["amenity"="fast_food"]' },
  { key: "amenity", value: "cafe", category: "cafe", goodFor: ["relax", "rainy-day", "romantic"], selector: '["amenity"="cafe"]' },
  { key: "shop", value: "confectionery", category: "cafe", goodFor: ["kids", "family"], selector: '["shop"="confectionery"]' },
  { key: "shop", value: "bakery", category: "cafe", goodFor: ["family"], selector: '["shop"="bakery"]' },
  { key: "amenity", value: "bar", category: "bar", goodFor: ["evening", "romantic"], selector: '["amenity"="bar"]' },
  { key: "amenity", value: "pub", category: "bar", goodFor: ["evening"], selector: '["amenity"="pub"]' },
  { key: "amenity", value: "nightclub", category: "nightlife", goodFor: ["evening"], selector: '["amenity"="nightclub"]' },

  // --- shopping, markets, producers ---
  { key: "shop", value: "mall", category: "shopping", goodFor: ["rainy-day", "family"], selector: '["shop"="mall"]' },
  { key: "shop", value: "supermarket", category: "shopping", goodFor: [], selector: '["shop"="supermarket"]' },
  { key: "amenity", value: "marketplace", category: "market", goodFor: ["family", "culture"], selector: '["amenity"="marketplace"]' },
  { key: "shop", value: "farm", category: "producer", goodFor: ["family", "culture"], selector: '["shop"="farm"]' },
  { key: "shop", value: "cheese", category: "producer", goodFor: ["family", "culture"], selector: '["shop"="cheese"]' },
  { key: "craft", category: "producer", goodFor: ["culture", "family"], selector: '["craft"]["name"]' },

  // --- practical: transport, health, fuel, services ---
  { key: "aeroway", value: "aerodrome", category: "transport", goodFor: [], selector: '["aeroway"="aerodrome"]' },
  { key: "railway", value: "station", category: "transport", goodFor: [], selector: '["railway"="station"]' },
  { key: "amenity", value: "bus_station", category: "transport", goodFor: [], selector: '["amenity"="bus_station"]' },
  { key: "amenity", value: "taxi", category: "transport", goodFor: [], selector: '["amenity"="taxi"]' },
  { key: "amenity", value: "car_rental", category: "transport", goodFor: [], selector: '["amenity"="car_rental"]' },
  { key: "amenity", value: "pharmacy", category: "health", goodFor: [], selector: '["amenity"="pharmacy"]' },
  { key: "amenity", value: "hospital", category: "health", goodFor: [], selector: '["amenity"="hospital"]' },
  { key: "amenity", value: "clinic", category: "health", goodFor: [], selector: '["amenity"="clinic"]' },
  { key: "amenity", value: "fuel", category: "fuel", goodFor: [], selector: '["amenity"="fuel"]' },
  { key: "amenity", value: "atm", category: "services", goodFor: [], selector: '["amenity"="atm"]' },
  { key: "amenity", value: "bank", category: "services", goodFor: [], selector: '["amenity"="bank"]' },
];

/** Classify a raw OSM tag map into the BD taxonomy. First matching rule wins. */
export function classifyOsmTags(tags: Record<string, string>): TaxonomyRule | undefined {
  for (const rule of TAXONOMY) {
    const tagValue = tags[rule.key];
    if (tagValue === undefined) continue;
    if (rule.value === undefined || tagValue === rule.value) return rule;
  }
  return undefined;
}

/** Overpass selectors for a set of BD categories (deduped). */
export function selectorsForCategories(categories: BdCategory[]): string[] {
  const wanted = new Set(categories);
  const selectors = new Set<string>();
  for (const rule of TAXONOMY) {
    if (wanted.has(rule.category)) selectors.add(rule.selector);
  }
  return Array.from(selectors);
}
