import "server-only";
import { readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPage, upsertPage } from "@/lib/data/pages";
import { seedPages } from "@/lib/data/seed/pages";
import type { LocalizedText } from "@/lib/types";

/**
 * Data layer for the commercial-grade Gallery module (see
 * supabase/migrations/0008_gallery_images.sql). Replaces the old flow where
 * the admin hand-edited a flat "one URL per line" textarea
 * (PageContent.gallery, still used by restaurant/spa/pool/facilities, whose
 * galleries are out of scope here) with structured, uploaded image records:
 * title/alt text, a primary image flag, and drag-reordered sort order.
 *
 * The public /gallery page is intentionally left untouched (design AND
 * data source) — it still reads PageContent("gallery").gallery, a flat
 * string[]. Every mutation here re-derives that array (primary image
 * first, then by sort order) and writes it back via upsertPage, so the
 * public page automatically reflects what the admin manages without any
 * changes to public-facing code.
 */

export interface GalleryImage {
  id: string;
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

interface GalleryImageRow {
  id: string;
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

function fromRow(row: GalleryImageRow): GalleryImage {
  return {
    id: row.id,
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
 * share module state, so a variable written by the upload API route may
 * not be visible to the admin page's render. A small JSON file in the OS
 * temp dir is real, process-independent shared state (same idea as the
 * "write converted files to public/uploads" fallback in the upload route)
 * — this only ever runs locally; production always has Supabase configured
 * and uses the real gallery_images table below.
 */
const DEV_STORE_PATH = path.join(os.tmpdir(), "baeco-gallery-dev-store.json");

async function readDevStore(): Promise<GalleryImage[] | null> {
  try {
    const raw = await readFile(DEV_STORE_PATH, "utf8");
    return JSON.parse(raw) as GalleryImage[];
  } catch {
    return null;
  }
}

async function writeDevStore(images: GalleryImage[]): Promise<void> {
  await writeFile(DEV_STORE_PATH, JSON.stringify(images), "utf8");
}

function nextMemoryId(): string {
  return `gallery-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Seeds from the static seed data directly (never the live/mutable
 * `pages` store) so re-seeding is always deterministic, never a feedback
 * loop off a previous partial write. */
function seedFromStaticLegacy(): GalleryImage[] {
  const urls = seedPages.gallery?.gallery ?? [];
  return urls.map((url, i) => ({
    id: nextMemoryId(),
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

function sortImages(images: GalleryImage[]): GalleryImage[] {
  return [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.sortOrder - b.sortOrder);
}

/** Writes the current ordered image list back into the legacy PageContent
 * "gallery" slug, so the public site (unchanged) reflects admin edits. */
async function syncLegacyGalleryPage(images: GalleryImage[]): Promise<void> {
  const ordered = sortImages(images);
  const legacyPage = await getPage("gallery");
  if (!legacyPage) return;
  await upsertPage({ ...legacyPage, gallery: ordered.map((img) => img.url) });
}

/**
 * Reads all gallery images, ordered primary-first then by sort order.
 * Auto-migrates the legacy flat URL list into real rows the first time
 * this is called against an empty table — the admin never has to run a
 * manual migration step.
 */
export async function getGalleryImages(): Promise<GalleryImage[]> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("gallery_images").select("*").order("is_primary", { ascending: false }).order("sort_order", { ascending: true });
      if (!error && data) {
        if (data.length > 0) return (data as GalleryImageRow[]).map(fromRow);
        // Table reachable but empty: migrate the legacy URL list once.
        const migrated = seedFromStaticLegacy();
        if (migrated.length === 0) return [];
        const rows = migrated.map((img) => ({
          url: img.url,
          title: img.title,
          alt: img.alt,
          is_primary: img.isPrimary,
          sort_order: img.sortOrder,
        }));
        const { data: inserted, error: insertError } = await admin.from("gallery_images").insert(rows).select();
        if (!insertError && inserted) return (inserted as GalleryImageRow[]).map(fromRow);
      }
    }
  }
  let store = await readDevStore();
  if (store === null) {
    store = seedFromStaticLegacy();
    await writeDevStore(store);
  }
  return sortImages(store);
}

export async function getGalleryImageById(id: string): Promise<GalleryImage | undefined> {
  const images = await getGalleryImages();
  return images.find((img) => img.id === id);
}

/** Called by the upload API route once a file has been processed + stored. */
export async function createGalleryImageRecord(input: {
  url: string;
  storagePath: string | null;
  width: number;
  height: number;
  sizeBytes: number;
}): Promise<GalleryImage> {
  const existing = await getGalleryImages();
  const nextSortOrder = existing.length > 0 ? Math.max(...existing.map((img) => img.sortOrder)) + 1 : 0;
  const isPrimary = existing.length === 0;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("gallery_images")
        .insert({
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
      const created = fromRow(data as GalleryImageRow);
      await syncLegacyGalleryPage([...existing, created]);
      return created;
    }
  }
  const created: GalleryImage = {
    id: nextMemoryId(),
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
  const next = [...existing, created];
  await writeDevStore(next);
  await syncLegacyGalleryPage(next);
  return created;
}

export async function updateGalleryImageMeta(id: string, patch: { title?: LocalizedText; alt?: LocalizedText }): Promise<GalleryImage | undefined> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const row: Record<string, unknown> = {};
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.alt !== undefined) row.alt = patch.alt;
      const { data, error } = await admin.from("gallery_images").update(row).eq("id", id).select().maybeSingle();
      if (error) throw new Error(error.message);
      return data ? fromRow(data as GalleryImageRow) : undefined;
    }
  }
  const images = await getGalleryImages();
  const image = images.find((img) => img.id === id);
  if (!image) return undefined;
  if (patch.title !== undefined) image.title = patch.title;
  if (patch.alt !== undefined) image.alt = patch.alt;
  await writeDevStore(images);
  return image;
}

/** Unsets every other image's primary flag and sets this one. */
export async function setPrimaryGalleryImage(id: string): Promise<void> {
  const images = await getGalleryImages();
  if (!images.some((img) => img.id === id)) return;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { error: clearError } = await admin.from("gallery_images").update({ is_primary: false }).neq("id", id);
      if (clearError) throw new Error(clearError.message);
      const { error: setError } = await admin.from("gallery_images").update({ is_primary: true }).eq("id", id);
      if (setError) throw new Error(setError.message);
      await syncLegacyGalleryPage(images.map((img) => ({ ...img, isPrimary: img.id === id })));
      return;
    }
  }
  const next = images.map((img) => ({ ...img, isPrimary: img.id === id }));
  await writeDevStore(next);
  await syncLegacyGalleryPage(next);
}

/** Persists a new display order from an admin drag-and-drop reorder. */
export async function reorderGalleryImages(orderedIds: string[]): Promise<void> {
  const images = await getGalleryImages();
  const byId = new Map(images.map((img) => [img.id, img]));

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      await Promise.all(
        orderedIds.map((id, index) => {
          if (!byId.has(id)) return Promise.resolve();
          return admin.from("gallery_images").update({ sort_order: index }).eq("id", id);
        })
      );
      await syncLegacyGalleryPage(orderedIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index })).filter(Boolean));
      return;
    }
  }
  const next = orderedIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index })).filter(Boolean);
  await writeDevStore(next);
  await syncLegacyGalleryPage(next);
}

/**
 * Deletes the DB record and the underlying Storage object (best-effort —
 * an orphaned Storage file must never block the record's deletion). If the
 * deleted image was primary, promotes the next one (by sort order).
 */
export async function deleteGalleryImage(id: string): Promise<void> {
  const images = await getGalleryImages();
  const target = images.find((img) => img.id === id);
  if (!target) return;
  const remaining = images.filter((img) => img.id !== id);

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
      const { error } = await admin.from("gallery_images").delete().eq("id", id);
      if (error) throw new Error(error.message);
      if (target.isPrimary && remaining.length > 0) {
        await setPrimaryGalleryImage(remaining.sort((a, b) => a.sortOrder - b.sortOrder)[0].id);
      } else {
        await syncLegacyGalleryPage(remaining);
      }
      return;
    }
  }
  let next = remaining;
  if (target.isPrimary && remaining.length > 0) {
    const promoted = [...remaining].sort((a, b) => a.sortOrder - b.sortOrder)[0];
    next = remaining.map((img) => ({ ...img, isPrimary: img.id === promoted.id }));
  }
  await writeDevStore(next);
  await syncLegacyGalleryPage(next);
}
