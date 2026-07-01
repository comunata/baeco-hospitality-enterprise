export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * When Supabase credentials are not configured, every module in lib/data
 * transparently falls back to the bundled seed data so the whole platform
 * (site, booking engine, admin, portal) stays fully functional in demo/dev
 * mode. Set these two env vars (plus SUPABASE_SERVICE_ROLE_KEY server-side)
 * to switch the platform to live data.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
