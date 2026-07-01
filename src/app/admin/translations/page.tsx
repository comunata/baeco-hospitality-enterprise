import { getServerDictionary } from "@/lib/i18n/server";
import { locales, localeLabels, readyLocales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/AdminTable";

function countKeys(obj: unknown): number {
  if (typeof obj === "string") return 1;
  if (obj && typeof obj === "object") return Object.values(obj).reduce((sum: number, v) => sum + countKeys(v), 0);
  return 0;
}

export default async function AdminTranslationsPage() {
  const { dict } = await getServerDictionary();
  const referenceKeyCount = countKeys(getDictionary("en"));

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.translations}
        description="Textele sunt organizate pe chei de traducere (namespace-uri: site, admin, portal, ai, emails, whatsapp, seo, errors, forms) — fără text hardcodat."
      />
      <div className="overflow-x-auto rounded-sm border border-platinum/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-platinum/10 bg-graphite/60">
              <th className="px-4 py-3 text-[11px] uppercase tracking-widest text-stone">Limbă</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-widest text-stone">Chei traduse</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-widest text-stone">Status</th>
            </tr>
          </thead>
          <tbody>
            {locales.map((locale) => {
              const count = countKeys(getDictionary(locale));
              const ready = readyLocales.includes(locale);
              return (
                <tr key={locale} className="border-b border-platinum/5">
                  <td className="px-4 py-3 text-ivory">{localeLabels[locale]} ({locale})</td>
                  <td className="px-4 py-3 text-ivory">{count} / {referenceKeyCount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ready ? "active" : "inactive"} />
                    {!ready && <span className="ml-2 text-xs text-stone">preluat din EN, în curs de traducere</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
