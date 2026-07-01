import type { Dictionary } from "./ro";

/** Prepared locale — see de.ts for notes on fallback behaviour. */
const it: import("./partial").DeepPartial<Dictionary> = {
  common: {
    brand: "Baeco Hospitality",
    checkAvailability: "Verifica disponibilità",
    bookNow: "Prenota ora",
    from: "da",
    perNight: "/ notte",
  },
  nav: {
    home: "Home",
    rooms: "Camere",
    gallery: "Galleria",
    facilities: "Servizi",
    restaurant: "Ristorante",
    spa: "Spa",
    pool: "Piscina",
    events: "Eventi",
    offers: "Offerte",
    explore: "Esplora la zona",
    faq: "FAQ",
    contact: "Contatti",
    booking: "Prenotazione",
    portal: "Il mio account",
    admin: "Admin",
  },
  home: {
    heroTitle: "Un'esperienza di lusso, creata per te",
    heroSubtitle: "Camere eleganti, servizio impeccabile e attenzione discreta a ogni dettaglio.",
    heroCta: "Verifica disponibilità",
  },
};

export default it;
