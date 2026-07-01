import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { PageHeader } from "@/components/pages/PageHeader";
import { Section } from "@/components/ui/Section";
import { ContactForm } from "@/components/contact/ContactForm";
import { siteConfig } from "@/config/site";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader eyebrow={dict.nav.contact} title={dict.contact.title} />
      <Section>
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          <ContactForm dict={dict} />
          <div className="space-y-6 text-sm text-stone">
            <div>
              <p className="text-xs uppercase tracking-widest text-champagne">{dict.footer.contact}</p>
              <p className="mt-2 text-ivory">{siteConfig.contact.address}</p>
              <p className="mt-1">{siteConfig.contact.phone}</p>
              <p className="mt-1">{siteConfig.contact.email}</p>
            </div>
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-sm border border-emerald/40 px-6 py-3 text-xs font-medium uppercase tracking-widest text-emerald hover:bg-emerald/10"
            >
              WhatsApp
            </a>
            <div className="aspect-video overflow-hidden rounded-sm border border-platinum/10">
              <iframe
                title="map"
                className="h-full w-full"
                loading="lazy"
                src={`https://www.google.com/maps?q=${siteConfig.contact.lat},${siteConfig.contact.lng}&z=14&output=embed`}
              />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
