export const locales = ["ro", "en", "de", "fr", "it", "es"] as const;
export type Locale = (typeof locales)[number];

/** Locales with a complete, hand-reviewed dictionary. Others fall back to `en`. */
export const readyLocales: Locale[] = ["ro", "en"];

export const defaultLocale: Locale = "ro";

export const localeLabels: Record<Locale, string> = {
  ro: "Română",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  es: "Español",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
