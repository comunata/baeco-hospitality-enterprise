import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedReviews, seedOffers, seedKnowledgeBase } from "./seed/content";
import type { Review, Offer, KnowledgeItem } from "@/lib/types";

export async function getReviews(): Promise<Review[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length > 0) return data as unknown as Review[];
      }
    } catch {
      // Supabase unreachable/misconfigured at runtime — fall back to seed data
      // instead of crashing the request.
    }
  }
  return seedReviews;
}

export async function getOffers(): Promise<Offer[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.from("promotions").select("*").eq("active", true);
        if (!error && data && data.length > 0) return data as unknown as Offer[];
      }
    } catch {
      // Supabase unreachable/misconfigured at runtime — fall back to seed data
      // instead of crashing the request.
    }
  }
  return seedOffers.filter((o) => o.active);
}

export async function getKnowledgeBase(): Promise<KnowledgeItem[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("ai_knowledge").select("*");
      if (!error && data && data.length > 0) return data as unknown as KnowledgeItem[];
    }
  }
  return seedKnowledgeBase;
}
