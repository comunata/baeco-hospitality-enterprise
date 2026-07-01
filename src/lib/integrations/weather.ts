import "server-only";
import { siteConfig } from "@/config/site";

export interface WeatherSnapshot {
  tempC: number;
  condition: string;
  icon: string;
  source: "live" | "mock";
}

const apiKey = process.env.OPENWEATHER_API_KEY;

/**
 * Weather adapter. Falls back to a deterministic seasonal mock when
 * OPENWEATHER_API_KEY is not set, so the Explore Area always renders.
 */
export async function getWeatherToday(): Promise<WeatherSnapshot> {
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${siteConfig.contact.lat}&lon=${siteConfig.contact.lng}&units=metric&appid=${apiKey}`,
        { next: { revalidate: 1800 } }
      );
      if (res.ok) {
        const data = await res.json();
        return {
          tempC: Math.round(data.main.temp),
          condition: data.weather?.[0]?.main ?? "—",
          icon: data.weather?.[0]?.icon ?? "01d",
          source: "live",
        };
      }
    } catch {
      // fall through to mock
    }
  }

  const month = new Date().getMonth();
  const seasonalTemp = [2, 4, 9, 14, 19, 23, 26, 25, 20, 13, 7, 3][month];
  return { tempC: seasonalTemp, condition: "Partly cloudy", icon: "02d", source: "mock" };
}
