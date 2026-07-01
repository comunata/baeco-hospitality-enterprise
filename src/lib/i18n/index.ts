import { type Locale, defaultLocale } from "./config";
import ro, { type Dictionary } from "./dictionaries/ro";
import en from "./dictionaries/en";
import de from "./dictionaries/de";
import fr from "./dictionaries/fr";
import it from "./dictionaries/it";
import es from "./dictionaries/es";
import type { DeepPartial } from "./dictionaries/partial";

function deepMerge<T>(base: T, patch: DeepPartial<T> | undefined): T {
  if (!patch) return base;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(patch)) {
    const patchValue = (patch as Record<string, unknown>)[key];
    const baseValue = (base as Record<string, unknown>)[key];
    if (patchValue && typeof patchValue === "object" && !Array.isArray(patchValue) && baseValue) {
      result[key] = deepMerge(baseValue, patchValue as never);
    } else {
      result[key] = patchValue;
    }
  }
  return result as T;
}

const partials: Partial<Record<Locale, DeepPartial<Dictionary>>> = { de, fr, it, es };

const dictionaries: Record<Locale, Dictionary> = {
  ro,
  en,
  de: deepMerge(en, partials.de),
  fr: deepMerge(en, partials.fr),
  it: deepMerge(en, partials.it),
  es: deepMerge(en, partials.es),
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export type { Dictionary };
export * from "./config";
