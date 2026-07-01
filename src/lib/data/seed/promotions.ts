import type { Promotion, GiftVoucher } from "@/lib/types";

export const seedPromotions: Promotion[] = [
  { id: "promo-welcome10", code: "WELCOME10", type: "percentage", value: 10, validFrom: "2026-01-01", validTo: "2026-12-31", redemptions: 12, maxRedemptions: 500, active: true },
  { id: "promo-summer50", code: "SUMMER50", type: "fixed", value: 50, validFrom: "2026-06-01", validTo: "2026-08-31", redemptions: 4, maxRedemptions: 100, active: true },
];

export const seedVouchers: GiftVoucher[] = [
  { id: "voucher-gift50", code: "GIFT50", balance: 50, initialValue: 50, expiresAt: "2027-01-01", active: true },
  { id: "voucher-gift100", code: "GIFT100", balance: 100, initialValue: 100, expiresAt: "2027-01-01", active: true },
];
