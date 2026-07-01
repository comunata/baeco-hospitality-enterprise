"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { readyLocales, localeLabels, isLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(locale: Locale) {
    // eslint-disable-next-line react-hooks/immutability -- runs only inside the onClick handler, never during render
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    const segments = pathname.split("/");
    const isUrlPrefixed = isLocale(segments[1]);
    if (isUrlPrefixed) {
      segments[1] = locale;
      startTransition(() => router.push(segments.join("/") || "/"));
    } else {
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="flex items-center gap-1 text-xs uppercase tracking-widest">
      {readyLocales.map((locale) => (
        <button
          key={locale}
          disabled={isPending}
          onClick={() => switchTo(locale)}
          title={localeLabels[locale]}
          className={cn(
            "rounded-sm px-2 py-1 transition-colors",
            locale === current ? "text-champagne" : "text-stone hover:text-ivory"
          )}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
