import "server-only";
import { cookies } from "next/headers";
import { isLocale, defaultLocale } from "./config";
import { getDictionary } from "./index";

/** Resolves the current locale for non-URL-prefixed areas (admin, portal) from the `locale` cookie set by <LocaleSwitcher>. */
export async function getServerLocale() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value ?? defaultLocale;
  return isLocale(raw) ? raw : defaultLocale;
}

export async function getServerDictionary() {
  const locale = await getServerLocale();
  return { locale, dict: getDictionary(locale) };
}
