import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { seedFaq } from "@/lib/data/seed/faq";
import { PageHeader } from "@/components/pages/PageHeader";
import { Section } from "@/components/ui/Section";
import { FaqAccordion } from "@/components/faq/FaqAccordion";

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader eyebrow={dict.nav.faq} title={dict.faq.title} />
      <Section>
        <div className="mx-auto max-w-3xl">
          <FaqAccordion items={seedFaq.map((f) => ({ question: f.question[locale] ?? f.question.en, answer: f.answer[locale] ?? f.answer.en }))} />
        </div>
      </Section>
    </>
  );
}
