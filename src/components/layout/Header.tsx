import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";
import { LinkButton } from "@/components/ui/Button";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: `/${locale}/rooms`, label: dict.nav.rooms },
    { href: `/${locale}/gallery`, label: dict.nav.gallery },
    { href: `/${locale}/facilities`, label: dict.nav.facilities },
    { href: `/${locale}/restaurant`, label: dict.nav.restaurant },
    { href: `/${locale}/spa`, label: dict.nav.spa },
    { href: `/${locale}/offers`, label: dict.nav.offers },
    { href: `/${locale}/explore`, label: dict.nav.explore },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-platinum/10 bg-midnight/90 backdrop-blur">
      <Container className="relative flex h-20 items-center justify-between">
        <Link href={`/${locale}`} className="font-display text-2xl tracking-wide text-ivory">
          {dict.common.brand}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-xs font-medium uppercase tracking-[0.15em] text-stone transition-colors hover:text-champagne">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/portal"
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-stone transition-colors hover:text-champagne"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <circle cx="12" cy="8" r="3.25" />
              <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
            </svg>
            {dict.nav.portal}
          </Link>
          <LocaleSwitcher current={locale} />
          <LinkButton href={`/${locale}/booking`} className="text-xs px-5 py-2.5">
            {dict.common.bookNow}
          </LinkButton>
        </div>

        <MobileNav links={links} accountLink={{ href: "/portal", label: dict.nav.portal }} />
      </Container>
    </header>
  );
}
