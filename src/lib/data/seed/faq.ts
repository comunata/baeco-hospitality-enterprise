import type { LocalizedText } from "@/lib/types";

export interface FaqItem {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export const seedFaq: FaqItem[] = [
  { id: "faq-checkin", question: { ro: "La ce oră este check-in / check-out?", en: "What time is check-in / check-out?" }, answer: { ro: "Check-in de la 14:00, check-out până la 11:00. Early check-in și late check-out disponibile contra cost.", en: "Check-in from 2:00 PM, check-out until 11:00 AM. Early check-in and late check-out available for a fee." } },
  { id: "faq-pets", question: { ro: "Acceptați animale de companie?", en: "Do you accept pets?" }, answer: { ro: "Da, în anumite tipuri de cameră, cu o taxă suplimentară.", en: "Yes, in certain room types, for an additional fee." } },
  { id: "faq-parking", question: { ro: "Aveți parcare?", en: "Do you have parking?" }, answer: { ro: "Da, parcare privată gratuită, în limita locurilor disponibile.", en: "Yes, free private parking, subject to availability." } },
  { id: "faq-children", question: { ro: "Ce politică aveți pentru copii?", en: "What is your policy for children?" }, answer: { ro: "Copiii sub 6 ani stau gratuit. Pătuțurile sunt gratuite, la cerere.", en: "Children under 6 stay free. Cribs are free upon request." } },
  { id: "faq-cancellation", question: { ro: "Pot anula sau reprograma rezervarea?", en: "Can I cancel or reschedule my booking?" }, answer: { ro: "Anulare gratuită până la 5 zile înainte de sosire. Reprogramarea este posibilă din contul tău de client.", en: "Free cancellation up to 5 days before arrival. Rescheduling is possible from your client account." } },
  { id: "faq-payment", question: { ro: "Ce metode de plată acceptați?", en: "What payment methods do you accept?" }, answer: { ro: "Card bancar online, transfer bancar sau plată la fața locului, în funcție de rezervare.", en: "Online card payment, bank transfer, or payment on arrival, depending on the booking." } },
];
