import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { moduleFlags, type ModuleKey } from "@/config/modules";

/**
 * Key-value property settings (the `settings` table from 0001), with the
 * usual in-memory fallback. This is the admin-editable configuration layer:
 * booking policies, taxes, and runtime module toggles that override the
 * env-derived defaults in config/modules.ts.
 */

export interface BookingSettings {
  /** Tourist tax charged per adult per night (RON). */
  touristTaxPerPersonPerNight: number;
  /** Free-cancellation window, in days before check-in. */
  cancellationMinDaysBefore: number;
  /** Cancellation policy text shown in the booking flow and portal. */
  cancellationPolicy: { ro: string; en: string };
}

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  touristTaxPerPersonPerNight: 1,
  cancellationMinDaysBefore: 5,
  cancellationPolicy: {
    ro: "Anulare gratuită cu cel puțin 5 zile înainte de check-in. După acest termen, prima noapte nu este rambursabilă.",
    en: "Free cancellation at least 5 days before check-in. After this window, the first night is non-refundable.",
  },
};

const memorySettings = new Map<string, unknown>();

// Reads use the service-role client (no cookies) so settings are readable
// from statically-generated layouts/pages too — the cookie-bound client
// would force every SSG page dynamic (or break prerendering entirely).
async function readSetting<T>(key: string): Promise<T | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      if (admin) {
        const { data, error } = await admin.from("settings").select("value").eq("key", key).limit(1);
        if (!error && data && data.length > 0) return data[0].value as T;
      }
    } catch {
      // fall through to memory
    }
  }
  return memorySettings.get(key) as T | undefined;
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      // Select-then-update instead of upsert: the unique(property_id, key)
      // constraint can't dedupe rows with a NULL property_id (NULL != NULL),
      // so ON CONFLICT would silently insert duplicates.
      const { data: existing } = await admin.from("settings").select("id").eq("key", key).limit(1);
      const error = existing && existing.length > 0
        ? (await admin.from("settings").update({ value, updated_at: new Date().toISOString() }).eq("id", existing[0].id)).error
        : (await admin.from("settings").insert({ key, value })).error;
      if (error) throw new Error(error.message);
      return;
    }
  }
  memorySettings.set(key, value);
}

export async function getBookingSettings(): Promise<BookingSettings> {
  const stored = await readSetting<Partial<BookingSettings>>("booking");
  return { ...DEFAULT_BOOKING_SETTINGS, ...stored };
}

export async function saveBookingSettings(settings: BookingSettings): Promise<void> {
  await writeSetting("booking", settings);
}

/**
 * Runtime module flags: env defaults (config/modules.ts) overridden by
 * admin-set values stored in the settings table. This is what lets the
 * administrator switch AI Concierge / AI Local Guide / AI Booking Assistant
 * on and off from the panel, without a redeploy.
 */
export async function getModuleFlags(): Promise<Record<ModuleKey, boolean>> {
  const overrides = (await readSetting<Partial<Record<ModuleKey, boolean>>>("modules")) ?? {};
  return { ...moduleFlags, ...overrides };
}

export async function isModuleEnabledRuntime(key: ModuleKey): Promise<boolean> {
  const flags = await getModuleFlags();
  return flags[key];
}

export async function saveModuleOverrides(overrides: Partial<Record<ModuleKey, boolean>>): Promise<void> {
  const existing = (await readSetting<Partial<Record<ModuleKey, boolean>>>("modules")) ?? {};
  await writeSetting("modules", { ...existing, ...overrides });
}
