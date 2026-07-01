import type { Dictionary } from "./ro";

/** Prepared locale — see de.ts for notes on fallback behaviour. */
const es: import("./partial").DeepPartial<Dictionary> = {
  common: {
    brand: "Baeco Hospitality",
    checkAvailability: "Comprobar disponibilidad",
    bookNow: "Reservar ahora",
    from: "desde",
    perNight: "/ noche",
  },
  nav: {
    home: "Inicio",
    rooms: "Habitaciones",
    gallery: "Galería",
    facilities: "Instalaciones",
    restaurant: "Restaurante",
    spa: "Spa",
    pool: "Piscina",
    events: "Eventos",
    offers: "Ofertas",
    explore: "Explora la zona",
    faq: "Preguntas frecuentes",
    contact: "Contacto",
    booking: "Reserva",
    portal: "Mi cuenta",
    admin: "Admin",
  },
  home: {
    heroTitle: "Una experiencia de lujo, creada para ti",
    heroSubtitle: "Habitaciones elegantes, servicio impecable y atención discreta a cada detalle.",
    heroCta: "Comprobar disponibilidad",
  },
};

export default es;
