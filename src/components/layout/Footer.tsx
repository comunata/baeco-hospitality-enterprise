import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Container } from "@/components/ui/Container";
import { getPropertyContactInfo } from "@/lib/data/property";
import { AdminAccessIcon } from "./AdminAccessIcon";

export async function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const contact = await getPropertyContactInfo();
  const links = [
    { href: `/${locale}/rooms`, label: dict.nav.rooms },
    { href: `/${locale}/offers`, label: dict.nav.offers },
    { href: `/${locale}/explore`, label: dict.nav.explore },
    { href: `/${locale}/faq`, label: dict.nav.faq },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];
  const socials = [
    { href: contact.instagram, label: "Instagram" },
    { href: contact.facebook, label: "Facebook" },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-platinum/10 bg-graphite/60">
      <Container className="grid grid-cols-1 gap-12 py-16 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl text-ivory">{dict.common.brand}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone">{dict.footer.description}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-champagne">{dict.footer.quickLinks}</p>
          <ul className="mt-4 space-y-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-stone hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-champagne">{dict.footer.contact}</p>
          <ul className="mt-4 space-y-3 text-sm text-stone">
            <li>{contact.address}</li>
            <li>{contact.phone}</li>
            <li>{contact.email}</li>
            <li>
              {dict.footer.checkIn} {contact.checkIn} · {dict.footer.checkOut} {contact.checkOut}
            </li>
          </ul>
        </div>

        <div>
          {socials.length > 0 && (
            <>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-champagne">{dict.footer.followUs}</p>
              <div className="mt-4 flex gap-4 text-sm text-stone">
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="hover:text-ivory">
                    {s.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </Container>

      <div className="border-t border-platinum/10 py-6">
        <Container className="flex flex-col items-center justify-between gap-3 text-xs text-stone md:flex-row">
          <p>
            © {new Date().getFullYear()} {contact.name}. {dict.footer.rights}
          </p>
          <AdminAccessIcon />
        </Container>
      </div>
    </footer>
  );
}
