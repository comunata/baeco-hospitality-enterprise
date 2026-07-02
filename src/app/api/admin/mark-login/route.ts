import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markLastLogin } from "@/lib/data/users";

/** Called by AdminLoginForm right after a successful sign-in, using the
 * now-authenticated cookie-bound client to identify the caller — records
 * users.last_login_at for the Super Admin's user management screen. */
export async function POST() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false });

  await markLastLogin(user.id);
  return NextResponse.json({ ok: true });
}
