/**
 * Static fallback used when Supabase isn't configured (local/demo) or the
 * `properties` row hasn't loaded yet. The live site prefers the DB values
 * read via lib/data/property.ts (admin-editable from /admin/settings) —
 * this is the baseline, not the source of truth.
 */
export const siteConfig = {
  name: "Baeco Hospitality",
  legalName: "BaecoDigital",
  tagline: {
    ro: "Ospitalitate discretă, standard de lux.",
    en: "Discreet hospitality, luxury standard.",
  },
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "https://baeco-hospitality-enterprise.netlify.app",
  contact: {
    phone: "+40 754 417 713",
    whatsapp: "40754417713",
    email: "contact@baecodigital.ro",
    address: "Piața Republicii, nr. 1, 725300 Gura Humorului, România",
    lat: 47.5546,
    lng: 25.8898,
  },
  socials: {
    instagram: "",
    facebook: "",
  },
  checkIn: "14:00",
  checkOut: "11:00",
  currency: "RON",
} as const;
