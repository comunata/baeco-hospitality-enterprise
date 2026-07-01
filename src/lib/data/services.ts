import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedServices } from "./seed/services";
import type { ExtraService } from "@/lib/types";

const memoryServices: ExtraService[] = [...seedServices];

export async function getServices(): Promise<ExtraService[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("services").select("*").eq("active", true);
      if (!error && data && data.length > 0) return data as unknown as ExtraService[];
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
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: true });
      if (!error && data) return data as unknown as ExtraService[];
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
      const { data, error } = await admin.from("services").insert(service).select().single();
      if (!error && data) return data as unknown as ExtraService;
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
      const { data, error } = await admin.from("services").update(patch).eq("id", id).select().maybeSingle();
      if (!error && data) return data as unknown as ExtraService;
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
