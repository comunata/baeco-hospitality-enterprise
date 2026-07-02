import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedServices } from "./seed/services";
import type { ExtraService, LocalizedText } from "@/lib/types";

const memoryServices: ExtraService[] = [...seedServices];

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

export async function updateService(id: string, patch: Partial<ExtraService>): Promise<ExtraService | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("services").update(toRow(patch)).eq("id", id).select().maybeSingle();
      if (!error && data) return fromRow(data as ServiceRow);
      if (error) throw new Error(error.message);
    }
  }
  const service = memoryServices.find((s) => s.id === id);
  if (service) Object.assign(service, patch);
  return service;
}

export async function deleteService(id: string): Promise<void> {
  await updateService(id, { active: false });
}
