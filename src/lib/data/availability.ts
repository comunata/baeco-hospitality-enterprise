import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface RoomBlock {
  id: string;
  roomId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

/**
 * In-memory fallback for room availability blocks (maintenance/closures),
 * used when Supabase isn't configured. Mirrors lib/data/bookings.ts pattern.
 */
const memoryBlocks: RoomBlock[] = [];

function fromRow(row: Record<string, unknown>): RoomBlock {
  return {
    id: row.id as string,
    roomId: row.room_id as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    reason: (row.reason as string | null) ?? undefined,
  };
}

export async function getRoomBlocks(): Promise<RoomBlock[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("room_blocks").select("*").order("start_date", { ascending: true });
      if (!error && data) return (data as Array<Record<string, unknown>>).map(fromRow);
    }
  }
  return memoryBlocks;
}

export async function getRoomBlockById(id: string): Promise<RoomBlock | undefined> {
  const blocks = await getRoomBlocks();
  return blocks.find((b) => b.id === id);
}

// See note in lib/data/rooms.ts about using the service-role client for
// admin mutations until Etapa 6 wires up real Supabase Auth + RLS roles.
export async function createRoomBlock(block: Omit<RoomBlock, "id">): Promise<RoomBlock> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("room_blocks")
        .insert({ room_id: block.roomId, start_date: block.startDate, end_date: block.endDate, reason: block.reason })
        .select()
        .single();
      if (!error && data) return fromRow(data as Record<string, unknown>);
      if (error) throw new Error(error.message);
    }
  }
  const created = { id: `block-${Date.now().toString(36)}`, ...block };
  memoryBlocks.push(created);
  return created;
}

export async function deleteRoomBlock(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("room_blocks").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const idx = memoryBlocks.findIndex((b) => b.id === id);
  if (idx >= 0) memoryBlocks.splice(idx, 1);
}

export function isDateBlocked(blocks: RoomBlock[], roomId: string, day: string): boolean {
  return blocks.some((b) => b.roomId === roomId && b.startDate <= day && b.endDate > day);
}
