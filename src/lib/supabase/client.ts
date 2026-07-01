"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "./config";

export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
