import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Service-role client for trusted server-side operations only
 * (webhooks, admin API routes, scheduled jobs). Never import from
 * client components. Bypasses RLS — see supabase/migrations for policies.
 */
export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
