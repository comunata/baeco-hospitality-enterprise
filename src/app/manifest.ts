import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Baeco Hospitality",
    short_name: "Baeco",
    description: "Ospitalitate discretă, standard de lux.",
    start_url: "/ro",
    display: "standalone",
    background_color: "#090B0F",
    theme_color: "#090B0F",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
