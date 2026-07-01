import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { siteConfig } from "@/config/site";
import type {
  BdCategory,
  DiscoveredPlace,
  PlaceCandidate,
  PlaceStatus,
  PropertyProfile,
  ScanRecord,
} from "@/lib/discovery/types";

/**
 * Data-access layer for the Hospitality Intelligence Engine, following the
 * same pattern as every lib/data/* module: Supabase when configured, an
 * in-memory store otherwise, so the whole flow works in demo mode.
 *
 * NOTE on RLS: mutations use the service-role client (createAdminClient) for
 * the same Etapa-6 reason documented in lib/data/rooms.ts — real Supabase
 * Auth for admins isn't wired yet, so is_admin() would reject the RLS client.
 */

// ---------------------------------------------------------------------------
// In-memory fallback stores (reset on server restart)
// ---------------------------------------------------------------------------

const memoryPlaces: DiscoveredPlace[] = [];
const memoryScans: ScanRecord[] = [];
let memoryProfile: PropertyProfile | null = null;

// ---------------------------------------------------------------------------
// Row mapping (snake_case DB ↔ camelCase app)
// ---------------------------------------------------------------------------

interface PlaceRow {
  id: string;
  property_id: string | null;
  source: string;
  source_ref: string | null;
  name: string;
  name_en: string | null;
  category: string;
  subcategory: string | null;
  description: Record<string, string>;
  tags: string[];
  good_for: string[];
  lat: number;
  lng: number;
  distance_km: number;
  drive_minutes: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  image: string | null;
  quality_score: number;
  status: string;
  pinned: boolean;
  sort_order: number;
  created_at: string;
}

function rowToPlace(row: PlaceRow): DiscoveredPlace {
  return {
    id: row.id,
    propertyId: row.property_id ?? undefined,
    source: row.source as DiscoveredPlace["source"],
    sourceRef: row.source_ref ?? undefined,
    name: row.name,
    nameEn: row.name_en ?? undefined,
    category: row.category as BdCategory,
    subcategory: row.subcategory ?? undefined,
    description: { ro: row.description?.ro ?? "", en: row.description?.en ?? "" },
    tags: row.tags ?? [],
    goodFor: (row.good_for ?? []) as DiscoveredPlace["goodFor"],
    lat: row.lat,
    lng: row.lng,
    distanceKm: Number(row.distance_km),
    driveMinutes: row.drive_minutes,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    image: row.image ?? undefined,
    qualityScore: row.quality_score,
    status: row.status as PlaceStatus,
    pinned: row.pinned,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function placeToRow(place: Partial<DiscoveredPlace>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (place.propertyId !== undefined) row.property_id = place.propertyId;
  if (place.source !== undefined) row.source = place.source;
  if (place.sourceRef !== undefined) row.source_ref = place.sourceRef;
  if (place.name !== undefined) row.name = place.name;
  if (place.nameEn !== undefined) row.name_en = place.nameEn;
  if (place.category !== undefined) row.category = place.category;
  if (place.subcategory !== undefined) row.subcategory = place.subcategory;
  if (place.description !== undefined) row.description = place.description;
  if (place.tags !== undefined) row.tags = place.tags;
  if (place.goodFor !== undefined) row.good_for = place.goodFor;
  if (place.lat !== undefined) row.lat = place.lat;
  if (place.lng !== undefined) row.lng = place.lng;
  if (place.distanceKm !== undefined) row.distance_km = place.distanceKm;
  if (place.driveMinutes !== undefined) row.drive_minutes = place.driveMinutes;
  if (place.address !== undefined) row.address = place.address;
  if (place.phone !== undefined) row.phone = place.phone;
  if (place.website !== undefined) row.website = place.website;
  if (place.openingHours !== undefined) row.opening_hours = place.openingHours;
  if (place.image !== undefined) row.image = place.image;
  if (place.qualityScore !== undefined) row.quality_score = place.qualityScore;
  if (place.status !== undefined) row.status = place.status;
  if (place.pinned !== undefined) row.pinned = place.pinned;
  if (place.sortOrder !== undefined) row.sort_order = place.sortOrder;
  return row;
}

// ---------------------------------------------------------------------------
// Property profile
// ---------------------------------------------------------------------------

/** Demo profile derived from siteConfig, so the engine works out of the box. */
function demoProfile(): PropertyProfile {
  return {
    id: "property-demo",
    name: siteConfig.name,
    category: "hotel",
    address: siteConfig.contact.address,
    lat: siteConfig.contact.lat,
    lng: siteConfig.contact.lng,
    discoveryRadiusKm: 25,
  };
}

export async function getPropertyProfile(): Promise<PropertyProfile> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase.from("properties").select("*").limit(1).maybeSingle();
        if (data) {
          return {
            id: data.id,
            name: data.name,
            category: (data.category ?? "hotel") as PropertyProfile["category"],
            address: data.address ?? "",
            lat: data.lat ?? 0,
            lng: data.lng ?? 0,
            locality: data.locality ?? undefined,
            county: data.county ?? undefined,
            region: data.region ?? undefined,
            country: data.country ?? undefined,
            discoveryRadiusKm: Number(data.discovery_radius_km ?? 25),
            lastDiscoveryAt: data.last_discovery_at ?? undefined,
          };
        }
      }
    } catch {
      // fall through to memory/demo profile
    }
  }
  return memoryProfile ?? demoProfile();
}

export async function savePropertyProfile(profile: Omit<PropertyProfile, "id"> & { id?: string }): Promise<PropertyProfile> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const row = {
        name: profile.name,
        category: profile.category,
        address: profile.address,
        lat: profile.lat,
        lng: profile.lng,
        locality: profile.locality ?? null,
        county: profile.county ?? null,
        region: profile.region ?? null,
        country: profile.country ?? null,
        discovery_radius_km: profile.discoveryRadiusKm,
      };
      const { data: existing } = await admin.from("properties").select("id").limit(1).maybeSingle();
      if (existing?.id) {
        const { error } = await admin.from("properties").update(row).eq("id", existing.id);
        if (error) throw new Error(error.message);
        return { ...profile, id: existing.id };
      }
      const { data, error } = await admin.from("properties").insert(row).select("id").single();
      if (error) throw new Error(error.message);
      return { ...profile, id: data.id };
    }
  }
  memoryProfile = { ...profile, id: profile.id ?? "property-demo" };
  return memoryProfile;
}

export async function markDiscoveryRun(): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data: existing } = await admin.from("properties").select("id").limit(1).maybeSingle();
      if (existing?.id) await admin.from("properties").update({ last_discovery_at: new Date().toISOString() }).eq("id", existing.id);
      return;
    }
  }
  if (memoryProfile) memoryProfile.lastDiscoveryAt = new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

export async function listPlaces(filter?: { status?: PlaceStatus; category?: BdCategory }): Promise<DiscoveredPlace[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        let query = supabase.from("discovered_places").select("*");
        if (filter?.status) query = query.eq("status", filter.status);
        if (filter?.category) query = query.eq("category", filter.category);
        const { data, error } = await query
          .order("pinned", { ascending: false })
          .order("quality_score", { ascending: false })
          .order("distance_km", { ascending: true });
        if (!error && data) return (data as PlaceRow[]).map(rowToPlace);
      }
    } catch {
      // fall through to memory
    }
  }
  return memoryPlaces
    .filter((p) => (!filter?.status || p.status === filter.status) && (!filter?.category || p.category === filter.category))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.qualityScore - a.qualityScore || a.distanceKm - b.distanceKm);
}

export async function getApprovedPlaces(): Promise<DiscoveredPlace[]> {
  return listPlaces({ status: "approved" });
}

/**
 * Persists scan candidates as pending, skipping anything already known
 * (same sourceRef, any status — a rejected place stays rejected across
 * re-scans, which is what makes the weekly refresh non-annoying).
 * Returns how many new places were inserted.
 */
export async function ingestCandidates(candidates: PlaceCandidate[]): Promise<number> {
  const existing = await listPlaces();
  const knownRefs = new Set(existing.map((p) => p.sourceRef).filter(Boolean));
  const fresh = candidates.filter((c) => !c.sourceRef || !knownRefs.has(c.sourceRef));
  if (fresh.length === 0) return 0;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const rows = fresh.map((c) => placeToRow({ ...c, status: "pending", pinned: false, sortOrder: 0 }));
      const { error } = await admin.from("discovered_places").insert(rows);
      if (error) throw new Error(error.message);
      return fresh.length;
    }
  }

  for (const c of fresh) {
    memoryPlaces.push({ ...c, id: `place-${Math.random().toString(36).slice(2, 10)}`, status: "pending", pinned: false, sortOrder: 0, createdAt: new Date().toISOString() });
  }
  return fresh.length;
}

export async function setPlaceStatus(id: string, status: PlaceStatus): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("discovered_places").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const place = memoryPlaces.find((p) => p.id === id);
  if (place) place.status = status;
}

export async function setPlacesStatusBulk(ids: string[], status: PlaceStatus): Promise<void> {
  if (ids.length === 0) return;
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("discovered_places").update({ status, updated_at: new Date().toISOString() }).in("id", ids);
      if (error) throw new Error(error.message);
      return;
    }
  }
  for (const place of memoryPlaces) if (ids.includes(place.id)) place.status = status;
}

export async function setPlacePinned(id: string, pinned: boolean): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("discovered_places").update({ pinned, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const place = memoryPlaces.find((p) => p.id === id);
  if (place) place.pinned = pinned;
}

export async function updatePlace(id: string, patch: Partial<DiscoveredPlace>): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("discovered_places").update({ ...placeToRow(patch), updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const place = memoryPlaces.find((p) => p.id === id);
  if (place) Object.assign(place, patch);
}

export async function deletePlace(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("discovered_places").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const idx = memoryPlaces.findIndex((p) => p.id === id);
  if (idx >= 0) memoryPlaces.splice(idx, 1);
}

// ---------------------------------------------------------------------------
// Scan log
// ---------------------------------------------------------------------------

export async function recordScan(scan: Omit<ScanRecord, "id" | "createdAt">): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      await admin.from("discovery_scans").insert({
        trigger: scan.trigger,
        radius_km: scan.radiusKm,
        categories: scan.categories,
        status: scan.status,
        found_count: scan.foundCount,
        new_count: scan.newCount,
        message: scan.message ?? null,
      });
      return;
    }
  }
  memoryScans.unshift({ ...scan, id: `scan-${Date.now().toString(36)}`, createdAt: new Date().toISOString() });
}

export async function listScans(limit = 10): Promise<ScanRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.from("discovery_scans").select("*").order("created_at", { ascending: false }).limit(limit);
        if (!error && data) {
          return data.map((row) => ({
            id: row.id,
            propertyId: row.property_id ?? undefined,
            trigger: row.trigger,
            radiusKm: Number(row.radius_km),
            categories: row.categories ?? [],
            status: row.status,
            foundCount: row.found_count,
            newCount: row.new_count,
            message: row.message ?? undefined,
            createdAt: row.created_at,
          }));
        }
      }
    } catch {
      // fall through to memory
    }
  }
  return memoryScans.slice(0, limit);
}
