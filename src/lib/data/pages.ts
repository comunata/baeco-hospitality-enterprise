import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedPages, type PageContent } from "./seed/pages";

const memoryPages: Record<string, PageContent> = { ...seedPages };

export async function getPage(slug: string): Promise<PageContent | undefined> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
      if (!error && data) return data as unknown as PageContent;
    }
  }
  return memoryPages[slug];
}

export async function getAllPages(): Promise<PageContent[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("pages").select("*");
      if (!error && data && data.length > 0) return data as unknown as PageContent[];
    }
  }
  return Object.values(memoryPages);
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
  memoryPages[page.slug] = page;
  return page;
}
