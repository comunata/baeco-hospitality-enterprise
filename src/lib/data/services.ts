import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedServices } from "./seed/services";
import type { ExtraService, LocalizedText } from "@/lib/types";

const memoryServices: ExtraService[] = [...seedServices];

// The `services.id` column is a Postgres uuid (see supabase/migrations/
// 0001_init.sql), but the seed/demo fallback data below identifies each
// service with a fixed slug-shaped string (e.g. "svc-dinner") so it works
// without a database. When the admin UI is showing that fallback data —
// because the live `services` table has no rows yet, or hasn't been seeded
// — its "id" is never a real UUID, so it must never be sent straight into
// a `.eq("id", …)` query (Postgres rejects it with "invalid input syntax
// for type uuid"). uuidPattern lets update/delete tell the two apart and
// resolve a non-UUID id to its real row via `slug` first.
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// snake_case DB row ↔ camelCase app type (see note in lib/data/rooms.ts).
interface ServiceRow {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  charge_type: ExtraService["chargeType"];
  active: boolean;
  available_from: string | null;
  available_to: string | null;
}

function fromRow(row: ServiceRow): ExtraService {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name ?? { ro: "", en: "" },
    description: row.description ?? { ro: "", en: "" },
    price: Number(row.price),
    chargeType: row.charge_type,
    active: row.active,
    availableFrom: row.available_from ?? undefined,
    availableTo: row.available_to ?? undefined,
  };
}

function toRow(service: Partial<ExtraService>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (service.slug !== undefined) row.slug = service.slug;
  if (service.name !== undefined) row.name = service.name;
  if (service.description !== undefined) row.description = service.description;
  if (service.price !== undefined) row.price = service.price;
  if (service.chargeType !== undefined) row.charge_type = service.chargeType;
  if (service.active !== undefined) row.active = service.active;
  if (service.availableFrom !== undefined) row.available_from = service.availableFrom || null;
  if (service.availableTo !== undefined) row.available_to = service.availableTo || null;
  return row;
}

export async function getServices(): Promise<ExtraService[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.from("services").select("*").eq("active", true);
        if (!error && data && data.length > 0) return (data as ServiceRow[]).map(fromRow);
      }
    } catch {
      // fall through to seed data
    }
  }
  return memoryServices.filter((s) => s.active);
}

export async function getServicesByIds(ids: string[]): Promise<ExtraService[]> {
  const services = await getServices();
  return services.filter((s) => ids.includes(s.id));
}

/** Admin listing: includes inactive services too. */
export async function getAllServicesAdmin(): Promise<ExtraService[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: true });
        if (!error && data && data.length > 0) return (data as ServiceRow[]).map(fromRow);
      }
    } catch {
      // fall through to memory
    }
  }
  return memoryServices;
}

export async function getServiceById(id: string): Promise<ExtraService | undefined> {
  const services = await getAllServicesAdmin();
  return services.find((s) => s.id === id);
}

// See note in lib/data/rooms.ts about using the service-role client for
// admin mutations until Etapa 6 wires up real Supabase Auth + RLS roles.
export async function createService(service: ExtraService): Promise<ExtraService> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("services").insert(toRow(service)).select().single();
      if (!error && data) return fromRow(data as ServiceRow);
      if (error) throw new Error(error.message);
    }
  }
  memoryServices.push(service);
  return service;
}

/**
 * Resolves a possibly-fake seed id (e.g. "svc-dinner") to the real uuid of
 * the matching row in `services`, by looking it up via its `slug` (unique,
 * see 0001_init.sql). Returns the id unchanged if it's already a real uuid.
 * Returns null when the id is fake and no row with that slug exists yet —
 * i.e. this service has never actually been persisted.
 */
async function resolveServiceUuid(admin: NonNullable<ReturnType<typeof createAdminClient>>, id: string): Promise<string | null> {
  if (uuidPattern.test(id)) return id;
  const slug = seedServices.find((s) => s.id === id)?.slug ?? memoryServices.find((s) => s.id === id)?.slug;
  if (!slug) return null;
  const { data, error } = await admin.from("services").select("id").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function updateService(id: string, patch: Partial<ExtraService>): Promise<ExtraService | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const realId = await resolveServiceUuid(admin, id);
      if (realId) {
        const { data, error } = await admin.from("services").update(toRow(patch)).eq("id", realId).select().maybeSingle();
        if (!error && data) return fromRow(data as ServiceRow);
        if (error) throw new Error(error.message);
      } else {
        // No row has ever been persisted for this (seed-only) service —
        // editing it is its first real save, so insert instead of update.
        const base = seedServices.find((s) => s.id === id) ?? memoryServices.find((s) => s.id === id);
        if (!base) return undefined;
        const merged: ExtraService = { ...base, ...patch };
        const { data, error } = await admin.from("services").insert(toRow(merged)).select().single();
        if (!error && data) return fromRow(data as ServiceRow);
        if (error) throw new Error(error.message);
      }
    }
  }
  const service = memoryServices.find((s) => s.id === id);
  if (service) Object.assign(service, patch);
  return service;
}

export async function deleteService(id: string): Promise<void> {
  await updateService(id, { active: false });
}
