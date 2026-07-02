import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { seedPromotions, seedVouchers } from "./seed/promotions";
import type { Promotion, GiftVoucher } from "@/lib/types";

// snake_case DB row ↔ camelCase app type (see note in lib/data/rooms.ts).
// This module previously cast Supabase rows straight to Promotion/
// GiftVoucher without translating valid_from/valid_to/max_redemptions/
// initial_value/expires_at — every date/limit field would read as
// `undefined` for a real DB row (validFrom/expiresAt/etc. don't exist on
// the snake_case row), silently breaking date-range/expiry/redemption-limit
// checks the moment a promotion or voucher is ever persisted.

interface PromotionRow {
  id: string;
  code: string;
  type: Promotion["type"];
  value: number;
  valid_from: string;
  valid_to: string;
  max_redemptions: number | null;
  redemptions: number;
  active: boolean;
  min_nights: number | null;
  min_subtotal: number | null;
}

function promotionFromRow(row: PromotionRow): Promotion {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    validFrom: row.valid_from,
    validTo: row.valid_to,
    maxRedemptions: row.max_redemptions ?? undefined,
    redemptions: row.redemptions,
    active: row.active,
    minNights: row.min_nights ?? undefined,
    minSubtotal: row.min_subtotal ?? undefined,
  };
}

interface VoucherRow {
  id: string;
  code: string;
  balance: number;
  initial_value: number;
  expires_at: string;
  active: boolean;
}

function voucherFromRow(row: VoucherRow): GiftVoucher {
  return {
    id: row.id,
    code: row.code,
    balance: Number(row.balance),
    initialValue: Number(row.initial_value),
    expiresAt: row.expires_at,
    active: row.active,
  };
}

export async function getPromotionByCode(code: string): Promise<Promotion | undefined> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return undefined;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("promotions").select("*").eq("code", normalized).eq("active", true).maybeSingle();
      if (!error && data) return promotionFromRow(data as PromotionRow);
    }
  }
  const now = new Date();
  return seedPromotions.find(
    (p) => p.code === normalized && p.active && new Date(p.validFrom) <= now && new Date(p.validTo) >= now
  );
}

export async function getAllPromotions(): Promise<Promotion[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("promotions").select("*");
      if (!error && data && data.length > 0) return (data as PromotionRow[]).map(promotionFromRow);
    }
  }
  return seedPromotions;
}

export async function getAllVouchers(): Promise<GiftVoucher[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("vouchers").select("*");
      if (!error && data && data.length > 0) return (data as VoucherRow[]).map(voucherFromRow);
    }
  }
  return seedVouchers;
}

export async function getVoucherByCode(code: string): Promise<GiftVoucher | undefined> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return undefined;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.from("vouchers").select("*").eq("code", normalized).eq("active", true).maybeSingle();
      if (!error && data) return voucherFromRow(data as VoucherRow);
    }
  }
  return seedVouchers.find((v) => v.code === normalized && v.active && new Date(v.expiresAt) >= new Date());
}

/**
 * Validates that a promotion code is usable for the given stay, beyond the
 * active/date-range checks already applied in getPromotionByCode. Returns an
 * error code string (suitable for a 400 API response) when invalid, or
 * undefined when the promotion may be applied.
 */
export function validatePromotionForStay(
  promotion: Promotion,
  params: { nights: number; subtotal: number }
): string | undefined {
  if (promotion.maxRedemptions != null && promotion.redemptions >= promotion.maxRedemptions) {
    return "promo_exhausted";
  }
  if (promotion.minNights != null && params.nights < promotion.minNights) {
    return `promo_min_nights_${promotion.minNights}`;
  }
  if (promotion.minSubtotal != null && params.subtotal < promotion.minSubtotal) {
    return `promo_min_subtotal_${promotion.minSubtotal}`;
  }
  return undefined;
}
