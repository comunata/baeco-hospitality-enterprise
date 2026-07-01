import type { LocalizedText } from "@/lib/types";

export interface Facility {
  id: string;
  icon: string;
  name: LocalizedText;
  description: LocalizedText;
}

export const seedFacilities: Facility[] = [
  { id: "fac-pool", icon: "◐", name: { ro: "Piscină exterioară", en: "Outdoor pool" }, description: { ro: "Piscină încălzită, deschisă de la mai la septembrie.", en: "Heated pool, open May to September." } },
  { id: "fac-spa", icon: "❋", name: { ro: "SPA & Wellness", en: "Spa & Wellness" }, description: { ro: "Saună, baie de aburi și tratamente de relaxare.", en: "Sauna, steam bath and relaxation treatments." } },
  { id: "fac-restaurant", icon: "◇", name: { ro: "Restaurant", en: "Restaurant" }, description: { ro: "Bucătărie de sezon, din produse locale.", en: "Seasonal cuisine from local produce." } },
  { id: "fac-parking", icon: "▢", name: { ro: "Parcare privată", en: "Private parking" }, description: { ro: "Gratuită, în limita locurilor disponibile.", en: "Free, subject to availability." } },
  { id: "fac-wifi", icon: "≈", name: { ro: "Wi-Fi de mare viteză", en: "High-speed Wi-Fi" }, description: { ro: "Acces gratuit în toată proprietatea.", en: "Free access throughout the property." } },
  { id: "fac-events", icon: "✦", name: { ro: "Spații pentru evenimente", en: "Event spaces" }, description: { ro: "Nunți, conferințe și celebrări private.", en: "Weddings, conferences and private celebrations." } },
];
