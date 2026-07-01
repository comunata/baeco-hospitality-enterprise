import type { LocalizedText } from "@/lib/types";

export interface PageContent {
  slug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  body: LocalizedText;
  gallery: string[];
}

const restaurantImages = [
  "/images/restaurant/467cb81481e3c6f0ceec4f94ede12692.jpg",
  "/images/restaurant/4c388507a21c0e7f441718cd1a3bfac8.jpg",
  "/images/restaurant/6fde2705e59dddd8c891df7e0b964760.jpg",
  "/images/restaurant/c92dde8d4369405b0faf4ce5b985b8d0.jpg",
  "/images/restaurant/fd812639e4dbbf241af4762c4c13857d.jpg",
];

// No dedicated spa/pool photoshoot exists among the delivered images;
// reuse the hero infinity-pool villa image, which is the closest visual match.
const spaPoolImages = [
  "/images/hero/8d593cacba16e0d6d2ae6e7108793c28.jpg",
  "/images/hero/b598dedbd81e9a4aa89d632f77b96418.jpg",
];

const facilitiesImages = [
  "/images/gallery/3bfeada71694cf98d7dff7bba429318e.jpg",
  "/images/gallery/63015d86a5eaf973696900bca4544616.jpg",
  "/images/gallery/c2466b8c95bc9d6076280416cac6dc4b.jpg",
];

const galleryImages = [
  "/images/gallery/3bfeada71694cf98d7dff7bba429318e.jpg",
  "/images/gallery/3f698bc9766d1150b80be2779192778a.jpg",
  "/images/gallery/63015d86a5eaf973696900bca4544616.jpg",
  "/images/gallery/70b9559d8b912a2b9c7cdee290b424c1.jpg",
  "/images/gallery/a7f8bb7a621b44ba977b3c300d6fb131.jpg",
  "/images/gallery/c2466b8c95bc9d6076280416cac6dc4b.jpg",
  "/images/gallery/d0e7cedd7aec94d497b3ab1a9bb34488.jpg",
  "/images/hero/955003c3edb995693e4f9f327f5498f4.jpg",
];

export const seedPages: Record<string, PageContent> = {
  restaurant: {
    slug: "restaurant",
    title: { ro: "Restaurant", en: "Restaurant" },
    subtitle: { ro: "Bucătărie de sezon, din produse locale", en: "Seasonal cuisine, from local produce" },
    body: {
      ro: "Restaurantul nostru propune un meniu care se schimbă odată cu anotimpurile, construit din ingrediente de la producători din zonă. Micul dejun este servit zilnic, iar cina este disponibilă pe bază de rezervare.",
      en: "Our restaurant offers a menu that evolves with the seasons, built from ingredients sourced from local producers. Breakfast is served daily, and dinner is available by reservation.",
    },
    gallery: restaurantImages,
  },
  spa: {
    slug: "spa",
    title: { ro: "SPA & Wellness", en: "Spa & Wellness" },
    subtitle: { ro: "O pauză completă de la ritmul zilnic", en: "A complete break from the everyday rhythm" },
    body: {
      ro: "Zona de SPA include saună, baie de aburi și o gamă de tratamente de relaxare. Acces disponibil pentru oaspeți și ca serviciu extra pentru vizitatori de o zi.",
      en: "The spa area includes a sauna, steam bath and a range of relaxation treatments. Access is available for guests and as an extra service for day visitors.",
    },
    gallery: spaPoolImages,
  },
  pool: {
    slug: "pool",
    title: { ro: "Piscină", en: "Pool" },
    subtitle: { ro: "Piscină exterioară încălzită", en: "Heated outdoor pool" },
    body: {
      ro: "Piscina este deschisă de la mai până în septembrie, cu șezlonguri și un bar de vară adiacent.",
      en: "The pool is open from May to September, with sun loungers and an adjacent summer bar.",
    },
    gallery: spaPoolImages,
  },
  facilities: {
    slug: "facilities",
    title: { ro: "Facilități", en: "Facilities" },
    subtitle: { ro: "Tot ce ai nevoie, la un pas distanță", en: "Everything you need, a step away" },
    body: {
      ro: "De la Wi-Fi de mare viteză la spații pentru evenimente, fiecare facilitate este gândită să susțină un sejur fără compromisuri.",
      en: "From high-speed Wi-Fi to event spaces, every facility is designed to support a stay without compromises.",
    },
    gallery: facilitiesImages,
  },
  gallery: {
    slug: "gallery",
    title: { ro: "Galerie", en: "Gallery" },
    subtitle: { ro: "O privire asupra proprietății", en: "A look inside the property" },
    body: { ro: "", en: "" },
    gallery: galleryImages,
  },
};
