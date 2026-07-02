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

/**
 * "Offers" (marketing cards: title/description/image/discountPercent) are
 * a different concept from "Promotions" (redeemable discount codes: code/
 * type/value/redemptions) — there is no `offers` table in the schema
 * (supabase/migrations/0001_init.sql only has `promotions`). This used to
 * query `promotions` and cast the result straight to `Offer[]`, which
 * would silently return objects with no `title`/`description` the moment
 * any promotion row existed (o.title.ro would throw on the admin/offers
 * page and the homepage's offers section). Offers are seed-only content
 * today; there is no persistence layer for them yet.
 */
export async function getOffers(): Promise<Offer[]> {
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
