import type { LocalizedText } from "@/lib/types";

/**
 * BD taxonomy — the categories every discovered place is classified into.
 * Experience categories feed guest-facing guides and itineraries; practical
 * categories feed the concierge ("unde e cea mai apropiată farmacie?").
 */
export const BD_CATEGORIES = [
  // experience
  "attraction",
  "culture",
  "nature",
  "trail",
  "adventure",
  "sport",
  "wellness",
  "family",
  "restaurant",
  "cafe",
  "bar",
  "nightlife",
  "shopping",
  "market",
  "producer",
  // practical
  "transport",
  "health",
  "fuel",
  "services",
] as const;

export type BdCategory = (typeof BD_CATEGORIES)[number];

export const EXPERIENCE_CATEGORIES: BdCategory[] = [
  "attraction", "culture", "nature", "trail", "adventure", "sport", "wellness",
  "family", "restaurant", "cafe", "bar", "nightlife", "shopping", "market", "producer",
];

export const PRACTICAL_CATEGORIES: BdCategory[] = ["transport", "health", "fuel", "services"];

/** Guest personas used for personalized recommendations & itineraries. */
export const PERSONAS = ["family", "kids", "romantic", "rainy-day", "culture", "adventure", "relax", "evening"] as const;
export type Persona = (typeof PERSONAS)[number];

export type PlaceStatus = "pending" | "approved" | "rejected";
export type PlaceSource = "osm" | "manual" | "sample";

export type PropertyCategory = "hotel" | "guesthouse" | "villa" | "apartment" | "resort" | "chain";

/** The 2-minute onboarding profile. Everything else is derived/discovered. */
export interface PropertyProfile {
  id: string;
  name: string;
  category: PropertyCategory;
  address: string;
  lat: number;
  lng: number;
  locality?: string;
  county?: string;
  region?: string;
  country?: string;
  discoveryRadiusKm: number;
  lastDiscoveryAt?: string;
}

export interface DiscoveredPlace {
  id: string;
  propertyId?: string;
  source: PlaceSource;
  sourceRef?: string;
  name: string;
  nameEn?: string;
  category: BdCategory;
  subcategory?: string;
  description: LocalizedText;
  tags: string[];
  goodFor: Persona[];
  lat: number;
  lng: number;
  distanceKm: number;
  driveMinutes: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  image?: string;
  qualityScore: number;
  status: PlaceStatus;
  pinned: boolean;
  sortOrder: number;
  createdAt?: string;
}

/** A place as produced by a scan, before persistence/moderation. */
export type PlaceCandidate = Omit<DiscoveredPlace, "id" | "status" | "pinned" | "sortOrder" | "createdAt">;

export interface ScanRecord {
  id: string;
  propertyId?: string;
  trigger: "manual" | "scheduled" | "onboarding";
  radiusKm: number;
  categories: BdCategory[];
  status: "completed" | "failed";
  foundCount: number;
  newCount: number;
  message?: string;
  createdAt: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  locality?: string;
  county?: string;
  region?: string;
  country?: string;
}

export const RADIUS_OPTIONS_KM = [2, 5, 10, 25, 50] as const;

export const CATEGORY_LABELS: Record<BdCategory, { ro: string; en: string }> = {
  attraction: { ro: "Atracții turistice", en: "Attractions" },
  culture: { ro: "Cultură și istorie", en: "Culture & history" },
  nature: { ro: "Natură", en: "Nature" },
  trail: { ro: "Trasee", en: "Trails" },
  adventure: { ro: "Aventură", en: "Adventure" },
  sport: { ro: "Sport", en: "Sports" },
  wellness: { ro: "Wellness & SPA", en: "Wellness & SPA" },
  family: { ro: "Familie și copii", en: "Family & kids" },
  restaurant: { ro: "Restaurante", en: "Restaurants" },
  cafe: { ro: "Cafenele", en: "Cafes" },
  bar: { ro: "Baruri", en: "Bars" },
  nightlife: { ro: "Viață de noapte", en: "Nightlife" },
  shopping: { ro: "Shopping", en: "Shopping" },
  market: { ro: "Piețe", en: "Markets" },
  producer: { ro: "Producători locali", en: "Local producers" },
  transport: { ro: "Transport", en: "Transport" },
  health: { ro: "Sănătate", en: "Health" },
  fuel: { ro: "Benzinării", en: "Fuel stations" },
  services: { ro: "Servicii utile", en: "Useful services" },
};
