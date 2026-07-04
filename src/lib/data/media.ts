import "server-only";
import { readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPage, upsertPage } from "@/lib/data/pages";
import { seedPages } from "@/lib/data/seed/pages";
import { getRoomById, updateRoom } from "@/lib/data/rooms";
import type { LocalizedText } from "@/lib/types";

/**
 * Generic image-management data layer (see supabase/migrations/0009_
 * media_items.sql). One upload/manage system — this module, the
 * MediaManager component, and the /api/admin/media/upload route — serves
 * every "this thing has a managed set of images" admin surface: the site
 * Gallery (ownerType "gallery", no ownerId) and per-room image sets
 * (ownerType "room", ownerId = rooms.id). Adding a new owner type later
 * (e.g. restaurant/spa galleries) means adding one seed/sync branch below,
 * not a new table or a new component.
 *
 * Each owner type still has a "legacy" flat representation that the
 * PUBLIC site actually reads (PageContent.gallery for the site gallery,
 * Room.gallery/coverImage for rooms) — intentionally untouched, same
 * design, same data source. Every mutation here re-derives that flat
 * shape (primary image first) and writes it back, so public pages reflect
 * admin edits automatically with zero changes to public-facing code.
 */

export type MediaOwnerType = "gallery" | "room";

export interface MediaItem {
  id: string;
  ownerType: MediaOwnerType;
  ownerId: string | null;
  url: string;
  storagePath: string | null;
  title: LocalizedText;
  alt: LocalizedText;
  isPrimary: boolean;
  sortOrder: number;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: string;
}

interface MediaItemRow {
  id: string;
  owner_type: MediaOwnerType;
  owner_id: string | null;
  url: string;
  storage_path: string | null;
  title: LocalizedText | null;
  alt: LocalizedText | null;
  is_primary: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
}

function fromRow(row: MediaItemRow): MediaItem {
  return {
    id: row.id,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    url: row.url,
    storagePath: row.storage_path,
    title: row.title ?? { ro: "", en: "" },
    alt: row.alt ?? { ro: "", en: "" },
    isPrimary: row.is_primary,
    sortOrder: row.sort_order,
    width: row.width,
    height: row.height,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

const emptyText: LocalizedText = { ro: "", en: "" };

/**
 * Dev/local fallback store (Supabase not configured). A plain in-memory
 * module variable isn't reliable here: Next's dev server compiles Route
 * Handlers and Server Components as separate bundles that don't always
 * share module state. A JSON file in the OS temp dir is real,
 * process-independent shared state — only ever used locally; production
 * always has Supabase configured and uses the real media_items table.
 */
const DEV_STORE_PATH = path.join(os.tmpdir(), "baeco-media-dev-store.json");

async function readDevStore(): Promise<MediaItem[]> {
  try {
    const raw = await readFile(DEV_STORE_PATH, "utf8");
    return JSON.parse(raw) as MediaItem[];
  } catch {
    return [];
  }
}

async function writeDevStoreAll(all: MediaItem[]): Promise<void> {
  await writeFile(DEV_STORE_PATH, JSON.stringify(all), "utf8");
}

function nextMemoryId(): string {
  return `media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sameOwner(item: MediaItem, ownerType: MediaOwnerType, ownerId: string | null): boolean {
  return item.ownerType === ownerType && (item.ownerId ?? null) === (ownerId ?? null);
}

function sortItems(items: MediaItem[]): MediaItem[] {
  return [...items].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.sortOrder - b.sortOrder);
}

/** Seeds from each owner type's static/legacy source — never a live
 * store that might already reflect a partial write (avoids feedback
 * loops between the dev store and the legacy PageContent/Room record). */
async function seedFromLegacy(ownerType: MediaOwnerType, ownerId: string | null): Promise<MediaItem[]> {
  let urls: string[] = [];
  if (ownerType === "gallery") {
    urls = seedPages.gallery?.gallery ?? [];
  } else if (ownerType === "room" && ownerId) {
    const room = await getRoomById(ownerId);
    if (!room) return [];
    urls = [room.coverImage, ...room.gallery].filter((u, i, arr) => u && arr.indexOf(u) === i);
  }
  return urls.map((url, i) => ({
    id: nextMemoryId(),
    ownerType,
    ownerId,
    url,
    storagePath: null,
    title: emptyText,
    alt: emptyText,
    isPrimary: i === 0,
    sortOrder: i,
    width: null,
    height: null,
    sizeBytes: null,
    createdAt: new Date().toISOString(),
  }));
}

/** Writes the current ordered image list back into whichever legacy field
 * the public site actually reads for this owner type. */
async function syncLegacyOwner(ownerType: MediaOwnerType, ownerId: string | null, items: MediaItem[]): Promise<void> {
  const ordered = sortItems(items);
  const urls = ordered.map((img) => img.url);
  if (ownerType === "gallery") {
    const legacyPage = await getPage("gallery");
    if (!legacyPage) return;
    await upsertPage({ ...legacyPage, gallery: urls });
  } else if (ownerType === "room" && ownerId) {
    await updateRoom(ownerId, { gallery: urls, coverImage: urls[0] ?? "" });
  }
}

/**
 * Reads all media items for one owner, ordered primary-first then by sort
 * order. Auto-migrates that owner's legacy flat URL list into real rows
 * the first time this is called and finds none — no manual migration
 * step, for the site gallery or for any existing room.
 */
export async function getMediaItems(ownerType: MediaOwnerType, ownerId: string | null = null): Promise<MediaItem[]> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      let query = admin.from("media_items").select("*").eq("owner_type", ownerType);
      query = ownerId ? query.eq("owner_id", ownerId) : query.is("owner_id", null);
      const { data, error } = await query.order("is_primary", { ascending: false }).order("sort_order", { ascending: true });
      if (!error && data) {
        if (data.length > 0) return (data as MediaItemRow[]).map(fromRow);
        const migrated = await seedFromLegacy(ownerType, ownerId);
        if (migrated.length === 0) return [];
        const rows = migrated.map((img) => ({
          owner_type: ownerType,
          owner_id: ownerId,
          url: img.url,
          title: img.title,
          alt: img.alt,
          is_primary: img.isPrimary,
          sort_order: img.sortOrder,
        }));
        const { data: inserted, error: insertError } = await admin.from("media_items").insert(rows).select();
        if (!insertError && inserted) return (inserted as MediaItemRow[]).map(fromRow);
      }
    }
  }
  const all = await readDevStore();
  const forOwner = all.filter((item) => sameOwner(item, ownerType, ownerId));
  if (forOwner.length === 0) {
    const migrated = await seedFromLegacy(ownerType, ownerId);
    if (migrated.length > 0) {
      await writeDevStoreAll([...all, ...migrated]);
      return sortItems(migrated);
    }
  }
  return sortItems(forOwner);
}

export async function getMediaItemById(id: string): Promise<MediaItem | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data } = await admin.from("media_items").select("*").eq("id", id).maybeSingle();
      return data ? fromRow(data as MediaItemRow) : undefined;
    }
  }
  const all = await readDevStore();
  return all.find((item) => item.id === id);
}

/** Called by the upload API route once a file has been processed + stored. */
export async function createMediaItemRecord(
  ownerType: MediaOwnerType,
  ownerId: string | null,
  input: { url: string; storagePath: string | null; width: number | null; height: number | null; sizeBytes: number }
): Promise<MediaItem> {
  const existing = await getMediaItems(ownerType, ownerId);
  const nextSortOrder = existing.length > 0 ? Math.max(...existing.map((img) => img.sortOrder)) + 1 : 0;
  const isPrimary = existing.length === 0;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("media_items")
        .insert({
          owner_type: ownerType,
          owner_id: ownerId,
          url: input.url,
          storage_path: input.storagePath,
          is_primary: isPrimary,
          sort_order: nextSortOrder,
          width: input.width,
          height: input.height,
          size_bytes: input.sizeBytes,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      const created = fromRow(data as MediaItemRow);
      await syncLegacyOwner(ownerType, ownerId, [...existing, created]);
      return created;
    }
  }
  const created: MediaItem = {
    id: nextMemoryId(),
    ownerType,
    ownerId,
    url: input.url,
    storagePath: input.storagePath,
    title: emptyText,
    alt: emptyText,
    isPrimary,
    sortOrder: nextSortOrder,
    width: input.width,
    height: input.height,
    sizeBytes: input.sizeBytes,
    createdAt: new Date().toISOString(),
  };
  const all = await readDevStore();
  const nextAll = [...all.filter((item) => !sameOwner(item, ownerType, ownerId)), ...existing, created];
  await writeDevStoreAll(nextAll);
  await syncLegacyOwner(ownerType, ownerId, [...existing, created]);
  return created;
}

export async function updateMediaItemMeta(id: string, patch: { title?: LocalizedText; alt?: LocalizedText }): Promise<MediaItem | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const row: Record<string, unknown> = {};
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.alt !== undefined) row.alt = patch.alt;
      const { data, error } = await admin.from("media_items").update(row).eq("id", id).select().maybeSingle();
      if (error) throw new Error(error.message);
      return data ? fromRow(data as MediaItemRow) : undefined;
    }
  }
  const all = await readDevStore();
  const item = all.find((i) => i.id === id);
  if (!item) return undefined;
  if (patch.title !== undefined) item.title = patch.title;
  if (patch.alt !== undefined) item.alt = patch.alt;
  await writeDevStoreAll(all);
  return item;
}

/** Unsets every other image's primary flag (within the same owner) and
 * sets this one. */
export async function setPrimaryMediaItem(ownerType: MediaOwnerType, ownerId: string | null, id: string): Promise<void> {
  const items = await getMediaItems(ownerType, ownerId);
  if (!items.some((img) => img.id === id)) return;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      let clearQuery = admin.from("media_items").update({ is_primary: false }).eq("owner_type", ownerType).neq("id", id);
      clearQuery = ownerId ? clearQuery.eq("owner_id", ownerId) : clearQuery.is("owner_id", null);
      const { error: clearError } = await clearQuery;
      if (clearError) throw new Error(clearError.message);
      const { error: setError } = await admin.from("media_items").update({ is_primary: true }).eq("id", id);
      if (setError) throw new Error(setError.message);
      await syncLegacyOwner(ownerType, ownerId, items.map((img) => ({ ...img, isPrimary: img.id === id })));
      return;
    }
  }
  const all = await readDevStore();
  const next = all.map((img) => (sameOwner(img, ownerType, ownerId) ? { ...img, isPrimary: img.id === id } : img));
  await writeDevStoreAll(next);
  await syncLegacyOwner(ownerType, ownerId, next.filter((img) => sameOwner(img, ownerType, ownerId)));
}

/** Persists a new display order from an admin drag-and-drop reorder. */
export async function reorderMediaItems(ownerType: MediaOwnerType, ownerId: string | null, orderedIds: string[]): Promise<void> {
  const items = await getMediaItems(ownerType, ownerId);
  const byId = new Map(items.map((img) => [img.id, img]));

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      await Promise.all(
        orderedIds.map((id, index) => {
          if (!byId.has(id)) return Promise.resolve();
          return admin.from("media_items").update({ sort_order: index }).eq("id", id);
        })
      );
      await syncLegacyOwner(ownerType, ownerId, orderedIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index })).filter(Boolean));
      return;
    }
  }
  const reordered = orderedIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index })).filter(Boolean);
  const all = await readDevStore();
  const next = [...all.filter((item) => !sameOwner(item, ownerType, ownerId)), ...reordered];
  await writeDevStoreAll(next);
  await syncLegacyOwner(ownerType, ownerId, reordered);
}

/**
 * Deletes the DB record and the underlying Storage object (best-effort —
 * an orphaned Storage file must never block the record's deletion). If the
 * deleted image was primary, promotes the next one (by sort order).
 */
export async function deleteMediaItem(ownerType: MediaOwnerType, ownerId: string | null, id: string): Promise<void> {
  const items = await getMediaItems(ownerType, ownerId);
  const target = items.find((img) => img.id === id);
  if (!target) return;
  const remaining = items.filter((img) => img.id !== id);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      if (target.storagePath) {
        try {
          await admin.storage.from("gallery").remove([target.storagePath]);
        } catch {
          // Orphaned storage object — not fatal, the record deletion below
          // is what matters for the admin/public-facing gallery.
        }
      }
      const { error } = await admin.from("media_items").delete().eq("id", id);
      if (error) throw new Error(error.message);
      if (target.isPrimary && remaining.length > 0) {
        await setPrimaryMediaItem(ownerType, ownerId, remaining.sort((a, b) => a.sortOrder - b.sortOrder)[0].id);
      } else {
        await syncLegacyOwner(ownerType, ownerId, remaining);
      }
      return;
    }
  }
  let nextForOwner = remaining;
  if (target.isPrimary && remaining.length > 0) {
    const promoted = [...remaining].sort((a, b) => a.sortOrder - b.sortOrder)[0];
    nextForOwner = remaining.map((img) => ({ ...img, isPrimary: img.id === promoted.id }));
  }
  const all = await readDevStore();
  const next = [...all.filter((item) => !sameOwner(item, ownerType, ownerId)), ...nextForOwner];
  await writeDevStoreAll(next);
  await syncLegacyOwner(ownerType, ownerId, nextForOwner);
}
