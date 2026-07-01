import { getServerDictionary } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { locales } from "@/lib/i18n/config";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { siteConfig } from "@/config/site";

export default async function AdminSeoPage() {
  const { dict } = await getServerDictionary();

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.seo} description="Sitemap, robots.txt, schema.org, Open Graph și hreflang sunt generate automat pentru fiecare limbă activă." />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-sm border border-platinum/10 bg-graphite/60 p-6">
          <h2 className="font-display text-lg text-ivory">Fișiere generate</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="/sitemap.xml" className="text-champagne underline" target="_blank" rel="noreferrer">/sitemap.xml</a>
            </li>
            <li>
              <a href="/robots.txt" className="text-champagne underline" target="_blank" rel="noreferrer">/robots.txt</a>
            </li>
            <li>
              <a href="/manifest.webmanifest" className="text-champagne underline" target="_blank" rel="noreferrer">/manifest.webmanifest</a>
            </li>
          </ul>
        </div>

        <div className="rounded-sm border border-platinum/10 bg-graphite/60 p-6">
          <h2 className="font-display text-lg text-ivory">Meta implicit per limbă</h2>
          <ul className="mt-4 space-y-4 text-sm">
            {locales.map((locale) => {
              const d = getDictionary(locale);
              return (
                <li key={locale} className="border-b border-platinum/10 pb-3 last:border-0">
                  <p className="text-xs uppercase tracking-widest text-champagne">{locale}</p>
                  <p className="mt-1 text-ivory">{d.seo.defaultTitle}</p>
                  <p className="text-stone">{d.seo.defaultDescription}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-platinum/10 bg-graphite/60 p-6 text-sm text-stone">
        <p>Domeniu canonical: <span className="text-ivory">{siteConfig.domain}</span></p>
        <p className="mt-1">Schema.org: LodgingBusiness pe pagina principală, Product pe fiecare cameră (vezi src/components/seo).</p>
      </div>
    </div>
  );
}
