import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getRooms } from "@/lib/data/rooms";
import { siteConfig } from "@/config/site";

const staticPaths = [
  "",
  "/rooms",
  "/gallery",
  "/facilities",
  "/restaurant",
  "/spa",
  "/pool",
  "/events",
  "/offers",
  "/explore",
  "/faq",
  "/contact",
  "/booking",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rooms = await getRooms();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({ url: `${siteConfig.domain}/${locale}${path}`, changeFrequency: "weekly", priority: path === "" ? 1 : 0.7 });
    }
    for (const room of rooms) {
      entries.push({ url: `${siteConfig.domain}/${locale}/rooms/${room.slug}`, changeFrequency: "weekly", priority: 0.8 });
    }
  }

  return entries;
}
