import "server-only";
import type { GeocodeResult } from "./types";

const NOMINATIM_BASE = process.env.DISCOVERY_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org";
const USER_AGENT = "BDHospitalityEnterprise/1.0 (discovery-engine)";
const TIMEOUT_MS = 8_000;

interface NominatimAddress {
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

function toGeocodeResult(item: NominatimResult): GeocodeResult {
  const a = item.address ?? {};
  return {
    lat: Number(item.lat),
    lng: Number(item.lon),
    displayName: item.display_name,
    locality: a.village ?? a.town ?? a.city ?? a.municipality,
    county: a.county,
    region: a.state ?? a.region,
    country: a.country,
  };
}

async function nominatimFetch(path: string): Promise<NominatimResult[] | NominatimResult | null> {
  try {
    const res = await fetch(`${NOMINATIM_BASE}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as NominatimResult[] | NominatimResult;
  } catch {
    // Offline / blocked network — callers fall back to manual GPS entry.
    return null;
  }
}

/** Address → GPS + locality/county/region/country. Returns null on failure. */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const data = await nominatimFetch(`/search?q=${encodeURIComponent(address)}&format=jsonv2&addressdetails=1&limit=1`);
  const first = Array.isArray(data) ? data[0] : null;
  if (!first?.lat || !first?.lon) return null;
  return toGeocodeResult(first);
}

/** GPS pin → address details. Returns null on failure. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const data = await nominatimFetch(`/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`);
  if (!data || Array.isArray(data) || !data.lat) return null;
  return toGeocodeResult(data);
}
