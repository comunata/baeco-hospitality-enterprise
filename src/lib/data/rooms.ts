import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedRooms } from "./seed/rooms";
import type { Room } from "@/lib/types";

/**
 * Data-access layer: reads from Supabase when configured, otherwise serves
 * the bundled seed data so the whole site keeps working out of the box.
 * This is the pattern every lib/data/* module in this project follows.
 */
export async function getRooms(): Promise<Room[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("rooms").select("*").eq("active", true);
      if (!error && data && data.length > 0) return data as unknown as Room[];
    }
  }
  return seedRooms.filter((r) => r.active);
}

/** Admin listing: includes inactive rooms too. */
export async function getAllRoomsAdmin(): Promise<Room[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("rooms").select("*").order("created_at", { ascending: true });
      if (!error && data) return data as unknown as Room[];
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
      const { data, error } = await admin.from("rooms").insert(room).select().single();
      if (!error && data) return data as unknown as Room;
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
      const { data, error } = await admin.from("rooms").update(patch).eq("id", id).select().maybeSingle();
      if (!error && data) return data as unknown as Room;
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
