/**
 * Central module registry for Baeco Hospitality Enterprise 2027.
 * Each module can be toggled on/off per property deployment.
 * Defaults are read from env vars (NEXT_PUBLIC_MODULE_<KEY>=false to disable),
 * falling back to `true`. Admin > Settings > Integrations can override these
 * at runtime once `settings` table values are wired in (see lib/data/settings.ts).
 */

export type ModuleKey =
  | "website"
  | "booking"
  | "admin"
  | "portal"
  | "aiConcierge"
  | "aiLocalGuide"
  | "explore"
  | "aiKnowledgeBase"
  | "seo"
  | "analytics"
  | "notifications"
  | "integrations";

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export const MODULES: ModuleDefinition[] = [
  { key: "website", label: "Website premium", description: "Site public: camere, galerie, facilități, restaurant, SPA, evenimente.", defaultEnabled: true },
  { key: "booking", label: "Booking Engine", description: "Disponibilitate, tarife, calcul preț, rezervări.", defaultEnabled: true },
  { key: "admin", label: "Admin Enterprise", description: "Panou de administrare complet.", defaultEnabled: true },
  { key: "portal", label: "Portal Client", description: "Cont client: rezervări, facturi, check-in online.", defaultEnabled: true },
  { key: "aiConcierge", label: "AI Concierge", description: "Asistent AI pentru oaspeți, bazat pe Knowledge Base.", defaultEnabled: true },
  { key: "aiLocalGuide", label: "AI Local Guide", description: "Ghid local AI: ce vizităm, unde mâncăm, planuri de vacanță.", defaultEnabled: true },
  { key: "explore", label: "Explore Area", description: "Pagină cu atracții, restaurante, trasee, evenimente locale.", defaultEnabled: true },
  { key: "aiKnowledgeBase", label: "AI Knowledge Base", description: "Bază de cunoștințe folosită de toate modulele AI.", defaultEnabled: true },
  { key: "seo", label: "SEO Enterprise", description: "Sitemap, robots, schema.org, Open Graph, hreflang.", defaultEnabled: true },
  { key: "analytics", label: "Analytics", description: "Google Analytics, Meta Pixel, surse rezervări.", defaultEnabled: true },
  { key: "notifications", label: "Notificări", description: "Email, WhatsApp, notificări interne admin.", defaultEnabled: true },
  { key: "integrations", label: "Integrări externe", description: "Plăți, calendar, channel manager, PMS.", defaultEnabled: true },
];

function envFlag(key: ModuleKey, fallback: boolean): boolean {
  const raw = process.env[`NEXT_PUBLIC_MODULE_${key.toUpperCase()}`];
  if (raw === undefined) return fallback;
  return raw !== "false" && raw !== "0";
}

/** Static module flags resolved from environment. For per-property runtime
 * overrides stored in Supabase, see `getModuleFlags()` in lib/data/settings.ts */
export const moduleFlags: Record<ModuleKey, boolean> = Object.fromEntries(
  MODULES.map((m) => [m.key, envFlag(m.key, m.defaultEnabled)])
) as Record<ModuleKey, boolean>;

export function isModuleEnabled(key: ModuleKey): boolean {
  return moduleFlags[key];
}
