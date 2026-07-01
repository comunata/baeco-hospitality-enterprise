import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildDestinationAnswer, buildDestinationCards } from "@/lib/destination-planner";

const requestSchema = z.object({
  question: z.string().min(1).max(1000),
  locale: z.string().optional(),
});

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "ai-local-guide", { maxRequests: 15, windowMs: 60_000 });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { question } = parsed.data;
  const locale = isLocale(parsed.data.locale ?? "") ? (parsed.data.locale as Locale) : defaultLocale;
  const dict = getDictionary(locale);
  const q = normalize(question);
  const isItineraryRequest = /(3 zile|trei zile|3 days|weekend|itinerar|plan)/.test(q);
  const wantsCards = isItineraryRequest || /(vizita|visit|copii|kids|ploua|rain|manc|eat|restaurant|traseu|route)/.test(q);

  try {
    const destination = buildDestinationAnswer(question, locale);
    return NextResponse.json({
      answer: destination.answer || dict.ai.concierge.handoffText,
      itinerary: isItineraryRequest,
      routeCards: wantsCards ? buildDestinationCards(locale).slice(0, isItineraryRequest ? 3 : 2) : undefined,
    });
  } catch {
    return NextResponse.json({ answer: dict.errors.generic, itinerary: false });
  }
}
