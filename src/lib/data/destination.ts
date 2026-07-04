import type { LocalizedText } from "@/lib/types";

export type DestinationCategory =
  | "unesco"
  | "nature"
  | "adventure"
  | "restaurant"
  | "museum"
  | "craft"
  | "wellness"
  | "shopping";

export interface DestinationPlace {
  id: string;
  name: LocalizedText;
  category: DestinationCategory;
  description: LocalizedText;
  distanceKm: number;
  driveMinutes: number;
  visitMinutes: number;
  tags: string[];
  goodFor: ("family" | "kids" | "romantic" | "rainy-day" | "culture" | "adventure" | "relax")[];
  image: string;
  mapsQuery: string;
  reservationNote?: LocalizedText;
}

export interface DestinationRouteStop {
  placeId: string;
  time: string;
  note: LocalizedText;
}

export interface DestinationRoute {
  id: string;
  title: LocalizedText;
  focus: LocalizedText;
  bestFor: ("family" | "couple" | "culture" | "adventure" | "relax")[];
  weather: "sunny" | "rainy" | "any";
  stops: DestinationRouteStop[];
}

export const destinationBase = {
  id: "gura-humorului-bucovina",
  name: "Gura Humorului, Bucovina",
  centerMapsQuery: "Gura Humorului Bucovina Romania",
  description: {
    ro: "Punct central pentru mănăstiri UNESCO, natură, tradiții, activități pentru copii și trasee de o zi în Bucovina.",
    en: "A central base for UNESCO monasteries, nature, traditions, family activities and one-day routes in Bucovina.",
  },
};

export const destinationPlaces: DestinationPlace[] = [
  {
    id: "voronet",
    name: { ro: "Mănăstirea Voroneț", en: "Voroneț Monastery" },
    category: "unesco",
    description: { ro: "Mănăstire pictată celebră pentru albastrul de Voroneț, ideală dimineața devreme pentru a evita aglomerația.", en: "Painted monastery famous for Voroneț blue, best visited early to avoid crowds." },
    distanceKm: 5,
    driveMinutes: 10,
    visitMinutes: 60,
    tags: ["unesco", "cultură", "fotografie"],
    goodFor: ["family", "romantic", "culture", "rainy-day"],
    image: "/images/explore/voronet.webp",
    mapsQuery: "Manastirea Voronet Gura Humorului",
  },
  {
    id: "humor",
    name: { ro: "Mănăstirea Humor", en: "Humor Monastery" },
    category: "unesco",
    description: { ro: "Obiectiv apropiat de Gura Humorului, potrivit pentru circuitul de vest și pentru o zi ușoară de început.", en: "A close landmark near Gura Humorului, suited for the western circuit and a relaxed first day." },
    distanceKm: 6,
    driveMinutes: 12,
    visitMinutes: 50,
    tags: ["unesco", "tradiții"],
    goodFor: ["family", "culture", "rainy-day"],
    image: "/images/hero/955003c3edb995693e4f9f327f5498f4.jpg",
    mapsQuery: "Manastirea Humor Gura Humorului",
  },
  {
    id: "arinis",
    name: { ro: "Complexul Ariniș", en: "Ariniș Leisure Complex" },
    category: "wellness",
    description: { ro: "Zonă de relaxare, piscină, SPA și activități pentru familii, la câteva minute de centru.", en: "Leisure area with pool, SPA and family activities only minutes from the center." },
    distanceKm: 2,
    driveMinutes: 5,
    visitMinutes: 150,
    tags: ["spa", "piscină", "familie"],
    goodFor: ["family", "kids", "rainy-day", "relax"],
    image: "/images/wellness/pool.webp",
    mapsQuery: "Complex Arinis Gura Humorului",
  },
  {
    id: "tiroliana",
    name: { ro: "Mega Tiroliana Bucovina", en: "Mega Zipline Bucovina" },
    category: "adventure",
    description: { ro: "Activitate de aventură pentru turiști activi; recomandată pe vreme bună și cu rezervare/verificare program.", en: "Adventure activity for active guests; recommended in good weather with schedule/reservation check." },
    distanceKm: 3,
    driveMinutes: 8,
    visitMinutes: 90,
    tags: ["aventură", "adrenalină", "outdoor"],
    goodFor: ["adventure", "kids", "family"],
    image: "/images/explore/cabin-lake.webp",
    mapsQuery: "Mega Tiroliana Bucovina Gura Humorului",
    reservationNote: { ro: "Verifică programul și disponibilitatea înainte de plecare.", en: "Check schedule and availability before departure." },
  },
  {
    id: "mocanita",
    name: { ro: "Mocănița Huțulca, Moldovița", en: "Huțulca Steam Train, Moldovița" },
    category: "adventure",
    description: { ro: "Plimbare scenică foarte potrivită pentru familii. Necesită verificarea programului și, ideal, rezervare online.", en: "A scenic ride, excellent for families. Schedule check and online reservation are recommended." },
    distanceKm: 32,
    driveMinutes: 45,
    visitMinutes: 180,
    tags: ["familie", "tren", "experiență"],
    goodFor: ["family", "kids", "romantic"],
    image: "/images/explore/2dfb12d1da3716e851848a54d2a77121.jpg",
    mapsQuery: "Mocanita Hutulca Moldovita",
    reservationNote: { ro: "Recomandă rezervare online, mai ales în weekend și sezon.", en: "Online booking is recommended, especially weekends and high season." },
  },
  {
    id: "moldovita",
    name: { ro: "Mănăstirea Moldovița", en: "Moldovița Monastery" },
    category: "unesco",
    description: { ro: "Mănăstire fortificată, potrivită pentru ruta relaxată cu Mocănița și Pasul Palma.", en: "Fortified monastery, suited for the relaxed route with the steam train and Palma Pass." },
    distanceKm: 32,
    driveMinutes: 45,
    visitMinutes: 60,
    tags: ["unesco", "istorie"],
    goodFor: ["family", "culture", "rainy-day"],
    image: "/images/explore/d15adec32154b69a742f02e2f60b36f9.jpg",
    mapsQuery: "Manastirea Moldovita",
  },
  {
    id: "sucevita",
    name: { ro: "Mănăstirea Sucevița", en: "Sucevița Monastery" },
    category: "unesco",
    description: { ro: "Mănăstire fortificată spectaculoasă, bună pentru circuitul de nord-vest.", en: "A spectacular fortified monastery, ideal for the north-west circuit." },
    distanceKm: 55,
    driveMinutes: 80,
    visitMinutes: 70,
    tags: ["unesco", "fortificat"],
    goodFor: ["culture", "rainy-day", "family"],
    image: "/images/explore/sucevita.webp",
    mapsQuery: "Manastirea Sucevita",
  },
  {
    id: "pasul-palma",
    name: { ro: "Pasul Palma", en: "Palma Pass" },
    category: "nature",
    description: { ro: "Belvedere cunoscută pe ruta Moldovița–Sucevița, recomandată pe vreme bună pentru fotografii.", en: "Known viewpoint on the Moldovița–Sucevița route, best in clear weather for photos." },
    distanceKm: 45,
    driveMinutes: 65,
    visitMinutes: 25,
    tags: ["belvedere", "fotografie", "natură"],
    goodFor: ["romantic", "adventure"],
    image: "/images/explore/bicaz-lake.webp",
    mapsQuery: "Pasul Palma Bucovina",
  },
  {
    id: "putna",
    name: { ro: "Mănăstirea Putna", en: "Putna Monastery" },
    category: "unesco",
    description: { ro: "Obiectiv major al Bucovinei, potrivit pentru o zi cu ritm alert și plecare dimineața devreme.", en: "A major Bucovina landmark, suitable for a faster-paced day with early departure." },
    distanceKm: 78,
    driveMinutes: 90,
    visitMinutes: 90,
    tags: ["istorie", "Ștefan cel Mare"],
    goodFor: ["culture", "rainy-day", "family"],
    image: "/images/explore/76bd2ebff6a2a70946f711da036ba39b.jpg",
    mapsQuery: "Manastirea Putna",
  },
  {
    id: "marginea",
    name: { ro: "Ceramica Neagră Marginea", en: "Marginea Black Pottery" },
    category: "craft",
    description: { ro: "Atelier și demonstrații de olărit, foarte bune pentru suveniruri și experiențe locale.", en: "Pottery workshop and demonstrations, great for souvenirs and local experiences." },
    distanceKm: 58,
    driveMinutes: 75,
    visitMinutes: 45,
    tags: ["meșteșug", "suveniruri"],
    goodFor: ["family", "kids", "rainy-day", "culture"],
    image: "/images/gallery/70b9559d8b912a2b9c7cdee290b424c1.jpg",
    mapsQuery: "Ceramica Neagra Marginea",
  },
  {
    id: "cetatea-sucevei",
    name: { ro: "Cetatea de Scaun a Sucevei", en: "Suceava Seat Fortress" },
    category: "museum",
    description: { ro: "Fortăreața medievală asociată cu Ștefan cel Mare, foarte bună pentru zi ploioasă sau culturală.", en: "Medieval fortress associated with Stephen the Great, excellent for rainy or cultural days." },
    distanceKm: 35,
    driveMinutes: 45,
    visitMinutes: 90,
    tags: ["istorie", "muzeu"],
    goodFor: ["family", "kids", "rainy-day", "culture"],
    image: "/images/explore/7da693d35809543df6b6f00e974dbadf.jpg",
    mapsQuery: "Cetatea de Scaun a Sucevei",
  },
  {
    id: "muzeul-satului",
    name: { ro: "Muzeul Satului Bucovinean", en: "Bucovina Village Museum" },
    category: "museum",
    description: { ro: "Case tradiționale și gospodării autentice, chiar lângă Cetatea Sucevei.", en: "Traditional houses and authentic households, next to Suceava Fortress." },
    distanceKm: 35,
    driveMinutes: 45,
    visitMinutes: 75,
    tags: ["tradiții", "muzeu"],
    goodFor: ["family", "kids", "rainy-day", "culture"],
    image: "/images/explore/aad6d71e5cc8168f3b107ef126924f95.jpg",
    mapsQuery: "Muzeul Satului Bucovinean Suceava",
  },
  {
    id: "bucovina-mall",
    name: { ro: "Bucovina Shopping City", en: "Bucovina Shopping City" },
    category: "shopping",
    description: { ro: "Oprire practică pentru cumpărături sau timp liber în Suceava înainte de retur.", en: "Practical stop for shopping or free time in Suceava before returning." },
    distanceKm: 36,
    driveMinutes: 45,
    visitMinutes: 60,
    tags: ["shopping", "indoor"],
    goodFor: ["rainy-day", "family"],
    image: "/images/restaurant/restaurant-interior.webp",
    mapsQuery: "Bucovina Shopping City Suceava",
  },
  {
    id: "stana-bucovineana",
    name: { ro: "Stână / pensiune locală", en: "Local sheepfold / guesthouse" },
    category: "restaurant",
    description: { ro: "Prânz cu specific bucovinean: păstrăv, hribi, tochitură, poale-n brâu și produse locale.", en: "Bucovina-style lunch: trout, wild mushrooms, traditional stew, sweet cheese pies and local produce." },
    distanceKm: 8,
    driveMinutes: 15,
    visitMinutes: 75,
    tags: ["gastronomie", "local"],
    goodFor: ["family", "romantic", "culture"],
    image: "/images/restaurant/bistro-local.webp",
    mapsQuery: "restaurant traditional Gura Humorului Bucovina",
  },
];

export const destinationRoutes: DestinationRoute[] = [
  {
    id: "west-unesco-adventure",
    title: { ro: "Ziua 1: Circuitul UNESCO de Vest", en: "Day 1: Western UNESCO Circuit" },
    focus: { ro: "Natură, tradiții și aventură aproape de Gura Humorului.", en: "Nature, traditions and adventure close to Gura Humorului." },
    bestFor: ["family", "couple", "culture", "adventure"],
    weather: "any",
    stops: [
      { placeId: "voronet", time: "09:00", note: { ro: "Vizită devreme, înainte de autocare.", en: "Visit early, before tour buses arrive." } },
      { placeId: "humor", time: "11:00", note: { ro: "Circuit scurt și ușor dinspre centru.", en: "Short, easy circuit from the center." } },
      { placeId: "stana-bucovineana", time: "13:00", note: { ro: "Prânz local, ideal după mănăstiri.", en: "Local lunch, ideal after the monasteries." } },
      { placeId: "arinis", time: "15:30", note: { ro: "Relaxare, SPA sau piscină; alternativă bună dacă plouă.", en: "Relaxation, SPA or pool; a good rainy-day alternative." } },
      { placeId: "tiroliana", time: "17:00", note: { ro: "Doar pe vreme bună și cu program verificat.", en: "Only in good weather and with schedule checked." } },
    ],
  },
  {
    id: "northwest-relaxed-family",
    title: { ro: "Ziua 2: Nord-Vest relaxat", en: "Day 2: Relaxed North-West Route" },
    focus: { ro: "Mocăniță, Moldovița, Pasul Palma și Sucevița, fără ritm obositor.", en: "Steam train, Moldovița, Palma Pass and Sucevița without a tiring pace." },
    bestFor: ["family", "couple", "culture"],
    weather: "sunny",
    stops: [
      { placeId: "mocanita", time: "09:30", note: { ro: "Rezervă/verifică programul înainte de plecare.", en: "Book/check schedule before leaving." } },
      { placeId: "moldovita", time: "12:30", note: { ro: "Vizită după Mocăniță.", en: "Visit after the steam train." } },
      { placeId: "pasul-palma", time: "14:30", note: { ro: "Oprire scurtă pentru belvedere și fotografii.", en: "Short viewpoint and photo stop." } },
      { placeId: "sucevita", time: "15:30", note: { ro: "Ultima vizită culturală a zilei.", en: "Last cultural visit of the day." } },
    ],
  },
  {
    id: "northwest-alert-putna",
    title: { ro: "Ziua 2 alternativă: Putna + Sucevița", en: "Day 2 alternative: Putna + Sucevița" },
    focus: { ro: "Variantă cu ritm alert pentru turiști care vor mai multă istorie.", en: "Faster-paced route for guests who want more history." },
    bestFor: ["culture", "couple"],
    weather: "any",
    stops: [
      { placeId: "putna", time: "08:30", note: { ro: "Plecare devreme; cea mai lungă deplasare din circuit.", en: "Early departure; the longest drive in the circuit." } },
      { placeId: "marginea", time: "12:30", note: { ro: "Demonstrații și suveniruri din ceramică neagră.", en: "Black pottery demos and souvenirs." } },
      { placeId: "sucevita", time: "14:30", note: { ro: "Vizită pe ruta de întoarcere.", en: "Visit on the return route." } },
      { placeId: "pasul-palma", time: "16:00", note: { ro: "Belvedere dacă vremea permite.", en: "Viewpoint if weather allows." } },
    ],
  },
  {
    id: "east-history-suceava",
    title: { ro: "Ziua 3: Traseul de Est", en: "Day 3: Eastern History Route" },
    focus: { ro: "Rădăcini istorice, muzee și tradiții urbane în Suceava.", en: "Historic roots, museums and urban traditions in Suceava." },
    bestFor: ["family", "culture", "relax"],
    weather: "rainy",
    stops: [
      { placeId: "cetatea-sucevei", time: "10:00", note: { ro: "Fortăreață medievală, potrivită și pentru copii.", en: "Medieval fortress, also suitable for kids." } },
      { placeId: "muzeul-satului", time: "12:00", note: { ro: "Case autentice și gospodării bucovinene.", en: "Authentic Bucovina houses and households." } },
      { placeId: "bucovina-mall", time: "15:00", note: { ro: "Timp liber, shopping sau pauză indoor.", en: "Free time, shopping or an indoor break." } },
    ],
  },
];

export function getPlaceById(id: string) {
  return destinationPlaces.find((place) => place.id === id);
}

export function googleMapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapsRouteLink(stopQueries: string[]) {
  const origin = destinationBase.centerMapsQuery;
  const destination = origin;
  const waypoints = stopQueries.join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
}
