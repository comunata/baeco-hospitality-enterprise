import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/ai/ChatWidget";
import { getModuleFlags } from "@/lib/data/settings";

export function generateStaticParams() {
  return [{ locale: "ro" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.seo.defaultTitle,
    description: dict.seo.defaultDescription,
    alternates: {
      canonical: `/${locale}`,
      languages: { ro: "/ro", en: "/en" },
    },
    openGraph: {
      title: dict.seo.defaultTitle,
      description: dict.seo.defaultDescription,
      locale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);
  const moduleFlags = await getModuleFlags();

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale as Locale} dict={dict} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale as Locale} dict={dict} />
      {moduleFlags.aiConcierge && <ChatWidget locale={locale as Locale} dict={dict} />}
    </div>
  );
}
