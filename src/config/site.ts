export const siteConfig = {
  name: "Baeco Hospitality",
  legalName: "Baeco Hospitality Enterprise",
  tagline: {
    ro: "Ospitalitate discretă, standard de lux.",
    en: "Discreet hospitality, luxury standard.",
  },
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "https://baeco-hospitality.example.com",
  contact: {
    phone: "+40 700 000 000",
    whatsapp: "40700000000",
    email: "rezervari@baeco-hospitality.example.com",
    address: "Str. Exemplu nr. 1, România",
    lat: 45.9432,
    lng: 24.9668,
  },
  socials: {
    instagram: "https://instagram.com/baecohospitality",
    facebook: "https://facebook.com/baecohospitality",
  },
  checkIn: "14:00",
  checkOut: "11:00",
  currency: "RON",
} as const;
