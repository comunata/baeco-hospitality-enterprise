import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getKnowledgeBase } from "@/lib/data/content";
import { getRooms } from "@/lib/data/rooms";
import { buildAiAreaContext } from "@/lib/intelligence/planner";
import { getBookingsForGuestEmail } from "@/lib/data/bookings";
import { getPortalSession } from "@/lib/portal/session";
import { completeChat } from "@/lib/integrations/ai";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { formatCurrency, formatDate } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  question: z.string().min(1).max(1000),
  locale: z.string().optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional().default([]),
});

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function scoreKnowledgeItem(question: string, keywords: string[]): number {
  const q = normalize(question);
  return keywords.reduce((score, keyword) => (q.includes(normalize(keyword)) ? score + 1 : score), 0);
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "ai-concierge", { maxRequests: 20, windowMs: 60_000 });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { question, history } = parsed.data;
  const locale = isLocale(parsed.data.locale ?? "") ? (parsed.data.locale as "ro" | "en") : defaultLocale;
  const dict = getDictionary(locale);

  const [knowledgeBase, rooms] = await Promise.all([getKnowledgeBase(), getRooms()]);

  const scored = knowledgeBase
    .map((item) => ({ item, score: scoreKnowledgeItem(question, [...item.keywords, item.question.ro, item.question.en]) }))
    .sort((a, b) => b.score - a.score);
  const bestMatch = scored[0]?.score ? scored[0].item : undefined;

  const matchedRoom = rooms.find((r) => normalize(question).includes(normalize(r.name.ro)) || normalize(question).includes(normalize(r.name.en)));

  // The AI Concierge runs inside the authenticated Portal Client, so when a
  // guest asks about "my stay/booking/reservation", ground the answer in
  // *their own* booking data only (never another guest's), matched via the
  // real portal session email — never trusted client input.
  const bookingKeywords = ["rezervarea mea", "sejurul meu", "my booking", "my stay", "my reservation", "cazarea mea"];
  const asksAboutOwnBooking = bookingKeywords.some((k) => normalize(question).includes(normalize(k)));
  let matchedBooking: Awaited<ReturnType<typeof getBookingsForGuestEmail>>[number] | undefined;
  if (asksAboutOwnBooking) {
    const session = await getPortalSession();
    if (session.authenticated && session.email) {
      const bookings = await getBookingsForGuestEmail(session.email);
      matchedBooking = bookings.find((b) => b.status !== "cancelled") ?? bookings[0];
    }
  }

  // Area questions ("unde pot mânca?", "ce e în apropiere?") are grounded in
  // the Hospitality Intelligence Engine's admin-approved knowledge base.
  const areaKeywords = ["unde", "aproape", "apropiere", "zona", "restaurant", "mananc", "manc", "farmacie", "benzinarie", "atractie", "vizit", "where", "nearby", "area", "eat", "pharmacy", "fuel", "visit", "attraction"];
  const asksAboutArea = areaKeywords.some((k) => normalize(question).includes(normalize(k)));
  const areaContext = asksAboutArea ? await buildAiAreaContext(locale) : "";

  if (!bestMatch && !matchedRoom && !matchedBooking && !areaContext) {
    return NextResponse.json({ answer: dict.ai.concierge.handoffText, handoff: true });
  }

  const groundingFacts: string[] = [];
  if (areaContext) groundingFacts.push(areaContext);
  if (bestMatch) groundingFacts.push(`Q: ${bestMatch.question[locale] ?? bestMatch.question.en}\nA: ${bestMatch.answer[locale] ?? bestMatch.answer.en}`);
  if (matchedRoom) {
    groundingFacts.push(
      `Room "${matchedRoom.name[locale] ?? matchedRoom.name.en}": from ${formatCurrency(matchedRoom.basePrice)}/night, max ${matchedRoom.maxAdults} adults + ${matchedRoom.maxChildren} children, ${matchedRoom.sizeSqm} m². Amenities: ${matchedRoom.amenities.join(", ")}.`
    );
  }
  if (matchedBooking) {
    const room = rooms.find((r) => r.id === matchedBooking.roomId);
    groundingFacts.push(
      `Guest's own booking ${matchedBooking.code}: room "${room?.name[locale] ?? room?.name.en ?? matchedBooking.roomId}", ` +
        `${formatDate(matchedBooking.checkIn)} to ${formatDate(matchedBooking.checkOut)}, status ${matchedBooking.status}, ` +
        `total ${formatCurrency(matchedBooking.totals.total, matchedBooking.totals.currency)}.`
    );
  }

  if (await import("@/lib/integrations/ai").then((m) => m.isAiConfigured())) {
    const answer = await completeChat([
      {
        role: "system",
        content: `You are the AI Concierge for ${dict.common.brand}, a luxury hospitality property. Answer ONLY using the facts provided below. Reply in ${locale === "ro" ? "Romanian" : "English"}. Never invent information not present in the facts. If the facts don't answer the question, say so plainly.\n\nFacts:\n${groundingFacts.join("\n\n")}`,
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: question },
    ]);
    if (answer) return NextResponse.json({ answer, handoff: false, engine: "openai" });
  }

  const fallbackAnswer = bestMatch ? bestMatch.answer[locale] ?? bestMatch.answer.en : groundingFacts[0];
  return NextResponse.json({ answer: fallbackAnswer, handoff: false, engine: "rules" });
}
