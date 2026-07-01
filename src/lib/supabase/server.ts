import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "./config";

export async function createClient() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // called from a Server Component render — safe to ignore, middleware refreshes the session
        }
      },
    },
  });
}
