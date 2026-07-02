import "server-only";
import fs from "fs";
import os from "os";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedPages, type PageContent } from "./seed/pages";

/**
 * Dev-only fallback store, file-backed (not a plain module variable) for
 * the same reason as lib/data/media.ts's DEV_STORE_PATH: Next's dev server
 * compiles Route Handlers and Server Components/Actions as separate module
 * graphs that don't reliably share a plain `let`/`const` module variable,
 * so a page updated via a Route Handler (e.g. the media upload endpoint
 * syncing gallery back into this page's `gallery` field) could otherwise
 * go invisible to Server Component reads. Never used once Supabase is
 * configured. Resets on server restart / tmpdir cleanup.
 */
const DEV_STORE_PATH = path.join(os.tmpdir(), "baeco-pages-dev-store.json");

function readDevStore(): Record<string, PageContent> {
  try {
    return JSON.parse(fs.readFileSync(DEV_STORE_PATH, "utf-8"));
  } catch {
    return { ...seedPages };
  }
}

function writeDevStore(pages: Record<string, PageContent>): void {
  fs.writeFileSync(DEV_STORE_PATH, JSON.stringify(pages));
}

export async function getPage(slug: string): Promise<PageContent | undefined> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
      if (!error && data) return data as unknown as PageContent;
    }
  }
  return readDevStore()[slug];
}

export async function getAllPages(): Promise<PageContent[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("pages").select("*");
      if (!error && data && data.length > 0) return data as unknown as PageContent[];
    }
  }
  return Object.values(readDevStore());
}

// See note in lib/data/rooms.ts about using the service-role client for
// admin mutations until Etapa 6 wires up real Supabase Auth + RLS roles.
export async function upsertPage(page: PageContent): Promise<PageContent> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.from("pages").upsert(page, { onConflict: "slug" }).select().single();
      if (!error && data) return data as unknown as PageContent;
      if (error) throw new Error(error.message);
    }
  }
  const pages = readDevStore();
  pages[page.slug] = page;
  writeDevStore(pages);
  return page;
}
