import type { Dictionary } from "./ro";

/** Prepared locale — see de.ts for notes on fallback behaviour. */
const fr: import("./partial").DeepPartial<Dictionary> = {
  common: {
    brand: "Baeco Hospitality",
    checkAvailability: "Vérifier la disponibilité",
    bookNow: "Réserver",
    from: "à partir de",
    perNight: "/ nuit",
  },
  nav: {
    home: "Accueil",
    rooms: "Chambres",
    gallery: "Galerie",
    facilities: "Équipements",
    restaurant: "Restaurant",
    spa: "Spa",
    pool: "Piscine",
    events: "Événements",
    offers: "Offres",
    explore: "Explorer la région",
    faq: "FAQ",
    contact: "Contact",
    booking: "Réservation",
    portal: "Mon compte",
    admin: "Admin",
  },
  home: {
    heroTitle: "Une expérience de luxe, conçue pour vous",
    heroSubtitle: "Chambres élégantes, service impeccable et attention discrète à chaque détail.",
    heroCta: "Vérifier la disponibilité",
  },
};

export default fr;
