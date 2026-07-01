import type { Dictionary } from "./ro";

/**
 * Prepared locale — not yet fully reviewed by a native speaker.
 * Only high-visibility keys are translated; everything else falls back to `en`
 * via the deep merge in `getDictionary`.
 */
const de: import("./partial").DeepPartial<Dictionary> = {
  common: {
    brand: "Baeco Hospitality",
    checkAvailability: "Verfügbarkeit prüfen",
    bookNow: "Jetzt buchen",
    from: "ab",
    perNight: "/ Nacht",
  },
  nav: {
    home: "Startseite",
    rooms: "Zimmer",
    gallery: "Galerie",
    facilities: "Ausstattung",
    restaurant: "Restaurant",
    spa: "Spa",
    pool: "Pool",
    events: "Veranstaltungen",
    offers: "Angebote",
    explore: "Umgebung entdecken",
    faq: "FAQ",
    contact: "Kontakt",
    booking: "Buchung",
    portal: "Mein Konto",
    admin: "Admin",
  },
  home: {
    heroTitle: "Ein Luxuserlebnis, für Sie geschaffen",
    heroSubtitle: "Elegante Zimmer, tadelloser Service und diskrete Aufmerksamkeit für jedes Detail.",
    heroCta: "Verfügbarkeit prüfen",
  },
};

export default de;
