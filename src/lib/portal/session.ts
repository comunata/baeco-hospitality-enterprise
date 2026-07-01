import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface PortalSession {
  authenticated: boolean;
  demoMode: boolean;
  email: string;
  fullName?: string;
}

/**
 * Resolves the current guest/customer session for the Portal Client.
 * Without Supabase configured, the portal runs in demo mode against the
 * bundled sample guest (see lib/data/seed/bookings.ts) so every screen
 * (bookings, invoices, loyalty, favorites...) can be reviewed end to end.
 */
export async function getPortalSession(): Promise<PortalSession> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return { authenticated: true, demoMode: false, email: user.email ?? "", fullName: user.user_metadata?.full_name };
      }
      return { authenticated: false, demoMode: false, email: "" };
    }
  }
  return { authenticated: true, demoMode: true, email: "alexandra@example.com", fullName: "Alexandra Marin" };
}
