import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { siteConfig } from "@/config/site";

/**
 * Public-facing property contact info, admin-editable from /admin/settings.
 * Reads/writes the same `properties` row the Discovery Engine profile lives
 * on (see lib/data/discovery.ts#getPropertyProfile), scoped to the fields
 * the public site and admin contact form actually need.
 *
 * Reads use the service-role client (no cookies), same reasoning as
 * lib/data/settings.ts: this is called from static/SSG pages (Footer,
 * homepage) — a cookie-bound client would force them dynamic or break
 * prerendering. Falls back to siteConfig when Supabase isn't configured or
 * no property row exists yet, so the site never renders empty contact info.
 */

export interface PropertyContactInfo {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  checkIn: string;
  checkOut: string;
  instagram: string;
  facebook: string;
  lat: number;
  lng: number;
  /** Tourist location, admin-editable (see /admin/discovery setup). */
  locality: string;
  county: string;
  region: string;
  country: string;
  /** Human-friendly "Locality, Region" label derived from the fields above. */
  areaLabel: string;
}

/** "Locality, Region" (falls back to county, then blank) — used by AI prompts and UI copy. */
function buildAreaLabel(locality: string, region: string, county: string): string {
  return [locality, region || county].filter(Boolean).join(", ");
}

function defaults(): PropertyContactInfo {
  const locality = siteConfig.contact.locality;
  const county = siteConfig.contact.county;
  const region = siteConfig.contact.region;
  return {
    name: siteConfig.legalName,
    email: siteConfig.contact.email,
    phone: siteConfig.contact.phone,
    whatsapp: siteConfig.contact.whatsapp,
    address: siteConfig.contact.address,
    checkIn: siteConfig.checkIn,
    checkOut: siteConfig.checkOut,
    instagram: siteConfig.socials.instagram,
    facebook: siteConfig.socials.facebook,
    lat: siteConfig.contact.lat,
    lng: siteConfig.contact.lng,
    locality,
    county,
    region,
    country: siteConfig.contact.country,
    areaLabel: buildAreaLabel(locality, region, county),
  };
}

interface PropertyRow {
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  instagram: string | null;
  facebook: string | null;
  lat: number | null;
  lng: number | null;
  locality: string | null;
  county: string | null;
  region: string | null;
  country: string | null;
}

function fromRow(row: PropertyRow, base: PropertyContactInfo): PropertyContactInfo {
  const locality = row.locality || base.locality;
  const county = row.county || base.county;
  const region = row.region || base.region;
  return {
    name: row.name || base.name,
    email: row.email || base.email,
    phone: row.phone || base.phone,
    whatsapp: row.whatsapp || base.whatsapp,
    address: row.address || base.address,
    checkIn: row.check_in_time || base.checkIn,
    checkOut: row.check_out_time || base.checkOut,
    instagram: row.instagram || base.instagram,
    facebook: row.facebook || base.facebook,
    lat: row.lat ?? base.lat,
    lng: row.lng ?? base.lng,
    locality,
    county,
    region,
    country: row.country || base.country,
    areaLabel: buildAreaLabel(locality, region, county),
  };
}

export async function getPropertyContactInfo(): Promise<PropertyContactInfo> {
  const base = defaults();
  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      if (admin) {
        const { data, error } = await admin
          .from("properties")
          .select("name, email, phone, whatsapp, address, check_in_time, check_out_time, instagram, facebook, lat, lng, locality, county, region, country")
          .limit(1);
        if (!error && data && data.length > 0) return fromRow(data[0] as PropertyRow, base);
      }
    } catch {
      // fall through to the static fallback
    }
  }
  return base;
}

export async function updatePropertyContactInfo(patch: Partial<PropertyContactInfo>): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase nu este configurat.");

  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.checkIn !== undefined) row.check_in_time = patch.checkIn;
  if (patch.checkOut !== undefined) row.check_out_time = patch.checkOut;
  if (patch.instagram !== undefined) row.instagram = patch.instagram || null;
  if (patch.facebook !== undefined) row.facebook = patch.facebook || null;

  const { data: existing } = await admin.from("properties").select("id").limit(1);
  if (existing && existing.length > 0) {
    const { error } = await admin.from("properties").update(row).eq("id", existing[0].id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await admin.from("properties").insert(row);
  if (error) throw new Error(error.message);
}
