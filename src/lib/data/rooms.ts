import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedRooms } from "./seed/rooms";
import type { LocalizedText, Room } from "@/lib/types";

/**
 * Data-access layer: reads from Supabase when configured, otherwise serves
 * the bundled seed data so the whole site keeps working out of the box.
 * This is the pattern every lib/data/* module in this project follows.
 *
 * The rooms table is snake_case with jsonb name/description/rules; the app
 * type is camelCase. fromRow/toRow do the translation — without them, DB
 * reads produce rooms whose fields the app can't see (maxAdults undefined)
 * and admin inserts are rejected by PostgREST (unknown camelCase columns).
 */

interface RoomRow {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  gallery: string[];
  cover_image: string | null;
  max_adults: number;
  max_children: number;
  size_sqm: number | null;
  beds: string[];
  amenities: string[];
  base_price: number;
  rules: LocalizedText;
  included_service_ids: string[];
  extra_service_ids: string[];
  virtual_tour_url: string | null;
  active: boolean;
  total_units: number | null;
}

function fromRow(row: RoomRow): Room {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name ?? { ro: "", en: "" },
    description: row.description ?? { ro: "", en: "" },
    gallery: row.gallery ?? [],
    coverImage: row.cover_image ?? row.gallery?.[0] ?? "",
    maxAdults: row.max_adults,
    maxChildren: row.max_children,
    sizeSqm: Number(row.size_sqm ?? 0),
    beds: row.beds ?? [],
    amenities: row.amenities ?? [],
    basePrice: Number(row.base_price),
    rules: row.rules ?? { ro: "", en: "" },
    includedServiceIds: row.included_service_ids ?? [],
    extraServiceIds: row.extra_service_ids ?? [],
    virtualTourUrl: row.virtual_tour_url ?? undefined,
    active: row.active,
    totalUnits: row.total_units ?? 1,
  };
}

function toRow(room: Partial<Room>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (room.slug !== undefined) row.slug = room.slug;
  if (room.name !== undefined) row.name = room.name;
  if (room.description !== undefined) row.description = room.description;
  if (room.gallery !== undefined) row.gallery = room.gallery;
  if (room.coverImage !== undefined) row.cover_image = room.coverImage;
  if (room.maxAdults !== undefined) row.max_adults = room.maxAdults;
  if (room.maxChildren !== undefined) row.max_children = room.maxChildren;
  if (room.sizeSqm !== undefined) row.size_sqm = room.sizeSqm;
  if (room.beds !== undefined) row.beds = room.beds;
  if (room.amenities !== undefined) row.amenities = room.amenities;
  if (room.basePrice !== undefined) row.base_price = room.basePrice;
  if (room.rules !== undefined) row.rules = room.rules;
  if (room.includedServiceIds !== undefined) row.included_service_ids = room.includedServiceIds;
  if (room.extraServiceIds !== undefined) row.extra_service_ids = room.extraServiceIds;
  if (room.virtualTourUrl !== undefined) row.virtual_tour_url = room.virtualTourUrl || null;
  if (room.active !== undefined) row.active = room.active;
  if (room.totalUnits !== undefined) row.total_units = room.totalUnits;
  return row;
}

export async function getRooms(): Promise<Room[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.from("rooms").select("*").eq("active", true);
        if (!error && data && data.length > 0) return (data as RoomRow[]).map(fromRow);
      }
    } catch {
      // Supabase unreachable/misconfigured at runtime — fall back to seed data
      // instead of crashing the request.
    }
  }
  return seedRooms.filter((r) => r.active);
}

/** Admin listing: includes inactive rooms too. */
export async function getAllRoomsAdmin(): Promise<Room[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.from("rooms").select("*").order("created_at", { ascending: true });
        if (!error && data && data.length > 0) return (data as RoomRow[]).map(fromRow);
      }
    } catch {
      // fall through to memory
    }
  }
  return memoryRooms;
}

export async function getRoomById(id: string): Promise<Room | undefined> {
  const rooms = await getAllRoomsAdmin();
  return rooms.find((r) => r.id === id);
}

export async function getRoomBySlug(slug: string): Promise<Room | undefined> {
  const rooms = await getRooms();
  return rooms.find((r) => r.slug === slug);
}

/**
 * In-memory fallback store, mirrors the pattern used in lib/data/bookings.ts,
 * so admin CRUD is testable end-to-end even without Supabase configured.
 * Resets on server restart.
 */
const memoryRooms: Room[] = [...seedRooms];

/**
 * NOTE on RLS: admin mutations use the service-role client (createAdminClient)
 * rather than the RLS-scoped client, because Etapa 6 (real Supabase Auth +
 * role-based RLS) is not implemented yet — `getAdminSession()` does not set
 * `auth.uid()`, so the `is_admin()` policy would reject every write from the
 * RLS-scoped client. Once Etapa 6 ships real admin auth, these should switch
 * back to the RLS-scoped `createClient()`.
 */
export async function createRoom(room: Room): Promise<Room> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      // id intentionally omitted: the table generates a uuid.
      const { data, error } = await admin.from("rooms").insert(toRow(room)).select().single();
      if (!error && data) return fromRow(data as RoomRow);
      if (error) throw new Error(error.message);
    }
  }
  memoryRooms.push(room);
  return room;
}

export async function updateRoom(id: string, patch: Partial<Room>): Promise<Room | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("rooms").update(toRow(patch)).eq("id", id).select().maybeSingle();
      if (!error && data) return fromRow(data as RoomRow);
      if (error) throw new Error(error.message);
    }
  }
  const room = memoryRooms.find((r) => r.id === id);
  if (room) Object.assign(room, patch);
  return room;
}

export async function deleteRoom(id: string): Promise<void> {
  // Soft-delete: keeps historical bookings referencing this room intact.
  await updateRoom(id, { active: false });
}
