import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedAttractions, seedEvents } from "./seed/explore";
import type { Attraction, LocalEvent } from "@/lib/types";

const memoryAttractions: Attraction[] = [...seedAttractions];
const memoryEvents: LocalEvent[] = [...seedEvents];

/**
 * NOTE: the DB schema's `attractions.category` check constraint only allows
 * 'attraction' | 'market' | 'shop' | 'producer' (see supabase/migrations/0001_init.sql),
 * while this app's Attraction type also uses 'restaurant' | 'cafe' (there's a
 * separate `restaurants` table in the schema that this data layer does not
 * yet read from — a pre-existing inconsistency in the codebase). Writing an
 * attraction with category 'restaurant'/'cafe' to Supabase will therefore be
 * rejected by the DB constraint; until the schema/admin restaurant CRUD is
 * unified, creating/editing those two categories only works reliably against
 * the in-memory fallback (i.e. without Supabase configured, or by relaxing
 * the DB constraint). Documented here and in the admin report.
 */
export async function getAttractions(): Promise<Attraction[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.from("attractions").select("*");
        if (!error && data && data.length > 0) return data as unknown as Attraction[];
      }
    } catch {
      // Supabase unreachable/misconfigured at runtime — fall back to seed data
      // instead of crashing the request.
    }
  }
  return memoryAttractions;
}

export async function getAttractionById(id: string): Promise<Attraction | undefined> {
  const attractions = await getAttractions();
  return attractions.find((a) => a.id === id);
}

export async function createAttraction(attraction: Attraction): Promise<Attraction> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("attractions").insert(attraction).select().single();
      if (!error && data) return data as unknown as Attraction;
      if (error) throw new Error(error.message);
    }
  }
  memoryAttractions.push(attraction);
  return attraction;
}

export async function updateAttraction(id: string, patch: Partial<Attraction>): Promise<Attraction | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("attractions").update(patch).eq("id", id).select().maybeSingle();
      if (!error && data) return data as unknown as Attraction;
      if (error) throw new Error(error.message);
    }
  }
  const attraction = memoryAttractions.find((a) => a.id === id);
  if (attraction) Object.assign(attraction, patch);
  return attraction;
}

export async function deleteAttraction(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("attractions").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const idx = memoryAttractions.findIndex((a) => a.id === id);
  if (idx >= 0) memoryAttractions.splice(idx, 1);
}

export async function getLocalEvents(): Promise<LocalEvent[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true });
      if (!error && data && data.length > 0) return data as unknown as LocalEvent[];
    }
  }
  return memoryEvents;
}

export async function getLocalEventById(id: string): Promise<LocalEvent | undefined> {
  const events = await getLocalEvents();
  return events.find((e) => e.id === id);
}

export async function createLocalEvent(event: LocalEvent): Promise<LocalEvent> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("events").insert(event).select().single();
      if (!error && data) return data as unknown as LocalEvent;
      if (error) throw new Error(error.message);
    }
  }
  memoryEvents.push(event);
  return event;
}

export async function updateLocalEvent(id: string, patch: Partial<LocalEvent>): Promise<LocalEvent | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("events").update(patch).eq("id", id).select().maybeSingle();
      if (!error && data) return data as unknown as LocalEvent;
      if (error) throw new Error(error.message);
    }
  }
  const event = memoryEvents.find((e) => e.id === id);
  if (event) Object.assign(event, patch);
  return event;
}

export async function deleteLocalEvent(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("events").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const idx = memoryEvents.findIndex((e) => e.id === id);
  if (idx >= 0) memoryEvents.splice(idx, 1);
}
