import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isUuid } from "@/lib/utils";
import { resolveRoomUuid } from "./rooms";
import { seedSeasons } from "./seed/seasons";
import type { Season } from "@/lib/types";

const memorySeasons: Season[] = [...seedSeasons];

// snake_case DB row ↔ camelCase app type (see note in lib/data/rooms.ts).
interface SeasonRow {
  id: string;
  name: Season["name"];
  start_date: string;
  end_date: string;
  multiplier: number;
  weekend_multiplier: number;
  min_nights: number | null;
}

function fromRow(row: SeasonRow): Season {
  return {
    id: row.id,
    name: row.name ?? { ro: "", en: "" },
    startDate: row.start_date,
    endDate: row.end_date,
    multiplier: Number(row.multiplier),
    weekendMultiplier: Number(row.weekend_multiplier),
    minNights: row.min_nights ?? undefined,
  };
}

function toRow(season: Partial<Season>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (season.name !== undefined) row.name = season.name;
  if (season.startDate !== undefined) row.start_date = season.startDate;
  if (season.endDate !== undefined) row.end_date = season.endDate;
  if (season.multiplier !== undefined) row.multiplier = season.multiplier;
  if (season.weekendMultiplier !== undefined) row.weekend_multiplier = season.weekendMultiplier;
  if (season.minNights !== undefined) row.min_nights = season.minNights ?? null;
  return row;
}

export async function getSeasons(): Promise<Season[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("seasons").select("*");
      if (!error && data && data.length > 0) return (data as SeasonRow[]).map(fromRow);
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
      const { data, error } = await admin.from("seasons").insert(toRow(season)).select().single();
      if (!error && data) return fromRow(data as SeasonRow);
      if (error) throw new Error(error.message);
    }
  }
  memorySeasons.push(season);
  return season;
}

/**
 * The `seasons` table (unlike rooms/services) has no unique slug-style
 * column to resolve a fake seed id ("season-low") against, so a non-uuid
 * id can only mean one thing: this season has never been persisted (the
 * `seasons` table is currently empty, so getSeasons() is still serving the
 * seed/demo fallback). Persisting it (via patch, or the seed data
 * unchanged) is therefore its first real save. Returns the real uuid.
 * Exported so setRoomRateOverride can resolve the season side of a
 * room_rates upsert the same way.
 */
export async function ensureSeasonUuid(admin: NonNullable<ReturnType<typeof createAdminClient>>, id: string, patch: Partial<Season> = {}): Promise<string | null> {
  if (isUuid(id)) return id;
  const base = seedSeasons.find((s) => s.id === id) ?? memorySeasons.find((s) => s.id === id);
  if (!base) return null;
  const merged: Season = { ...base, ...patch };
  const { data, error } = await admin.from("seasons").insert(toRow(merged)).select("id").single();
  if (error || !data) return null;
  return data.id as string;
}

export async function updateSeason(id: string, patch: Partial<Season>): Promise<Season | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      if (isUuid(id)) {
        const { data, error } = await admin.from("seasons").update(toRow(patch)).eq("id", id).select().maybeSingle();
        if (!error && data) return fromRow(data as SeasonRow);
        if (error) throw new Error(error.message);
      } else {
        const realId = await ensureSeasonUuid(admin, id, patch);
        if (!realId) return undefined;
        const { data, error } = await admin.from("seasons").select("*").eq("id", realId).maybeSingle();
        if (!error && data) return fromRow(data as SeasonRow);
        if (error) throw new Error(error.message);
      }
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
      // A non-uuid id was never persisted (see updateSeason) — nothing to
      // delete in the DB; only clear it from the in-memory fallback below.
      if (isUuid(id)) {
        const { error } = await admin.from("seasons").delete().eq("id", id);
        if (error) throw new Error(error.message);
      }
      const idx = memorySeasons.findIndex((s) => s.id === id);
      if (idx >= 0) memorySeasons.splice(idx, 1);
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
      // Both room_id and season_id are uuid FKs (room_rates table). The
      // Rates admin page combines rooms with seasons that may still be
      // seed/demo fallback data (fake ids like "season-low") if their
      // table is empty — resolve/auto-persist both sides first, or the
      // upsert fails with "invalid input syntax for type uuid".
      const [realRoomId, realSeasonId] = await Promise.all([resolveRoomUuid(admin, roomId), ensureSeasonUuid(admin, seasonId)]);
      if (!realRoomId || !realSeasonId) {
        throw new Error("room_or_season_not_found");
      }
      const { error } = await admin
        .from("room_rates")
        .upsert({ room_id: realRoomId, season_id: realSeasonId, override_price: overridePrice }, { onConflict: "room_id,season_id" });
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
