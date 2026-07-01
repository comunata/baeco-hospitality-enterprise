import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedSeasons } from "./seed/seasons";
import type { Season } from "@/lib/types";

const memorySeasons: Season[] = [...seedSeasons];

export async function getSeasons(): Promise<Season[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("seasons").select("*");
      if (!error && data && data.length > 0) return data as unknown as Season[];
    }
  }
  return memorySeasons;
}

export async function getSeasonById(id: string): Promise<Season | undefined> {
  const seasons = await getSeasons();
  return seasons.find((s) => s.id === id);
}

// See note in lib/data/rooms.ts about using the service-role client for
// admin mutations until Etapa 6 wires up real Supabase Auth + RLS roles.
export async function createSeason(season: Season): Promise<Season> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("seasons").insert(season).select().single();
      if (!error && data) return data as unknown as Season;
      if (error) throw new Error(error.message);
    }
  }
  memorySeasons.push(season);
  return season;
}

export async function updateSeason(id: string, patch: Partial<Season>): Promise<Season | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("seasons").update(patch).eq("id", id).select().maybeSingle();
      if (!error && data) return data as unknown as Season;
      if (error) throw new Error(error.message);
    }
  }
  const season = memorySeasons.find((s) => s.id === id);
  if (season) Object.assign(season, patch);
  return season;
}

export async function deleteSeason(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("seasons").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const idx = memorySeasons.findIndex((s) => s.id === id);
  if (idx >= 0) memorySeasons.splice(idx, 1);
}

/** Per-room fixed price override for a given season (room_rates table). */
export interface RoomRateOverride {
  id: string;
  roomId: string;
  seasonId: string;
  overridePrice: number | null;
}

const memoryRoomRates: RoomRateOverride[] = [];

export async function getRoomRateOverrides(): Promise<RoomRateOverride[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("room_rates").select("*");
      if (!error && data) {
        return (data as Array<Record<string, unknown>>).map((r) => ({
          id: r.id as string,
          roomId: r.room_id as string,
          seasonId: r.season_id as string,
          overridePrice: (r.override_price as number | null) ?? null,
        }));
      }
    }
  }
  return memoryRoomRates;
}

export async function setRoomRateOverride(roomId: string, seasonId: string, overridePrice: number | null): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin
        .from("room_rates")
        .upsert({ room_id: roomId, season_id: seasonId, override_price: overridePrice }, { onConflict: "room_id,season_id" });
      if (error) throw new Error(error.message);
      return;
    }
  }
  const existing = memoryRoomRates.find((r) => r.roomId === roomId && r.seasonId === seasonId);
  if (existing) {
    existing.overridePrice = overridePrice;
  } else {
    memoryRoomRates.push({ id: `rate-${roomId}-${seasonId}`, roomId, seasonId, overridePrice });
  }
}
