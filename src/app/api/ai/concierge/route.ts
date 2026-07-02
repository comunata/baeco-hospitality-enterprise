import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getKnowledgeBase, getOffers } from "@/lib/data/content";
import { getRooms } from "@/lib/data/rooms";
import { buildAiAreaContext } from "@/lib/intelligence/planner";
import { getBookingsForGuestEmail } from "@/lib/data/bookings";
import { getPortalSession } from "@/lib/portal/session";
import { getPropertyContactInfo } from "@/lib/data/property";
import { seedFacilities } from "@/lib/data/seed/facilities";
import { completeChatDetailed, isAiConfigured } from "@/lib/integrations/ai";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { formatCurrency, formatDate } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { isModuleEnabledRuntime } from "@/lib/data/settings";

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

  if (!(await isModuleEnabledRuntime("aiConcierge"))) {
    return NextResponse.json({ error: "module_disabled" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { question, history } = parsed.data;
  const locale = isLocale(parsed.data.locale ?? "") ? (parsed.data.locale as "ro" | "en") : defaultLocale;
  const dict = getDictionary(locale);

  const [knowledgeBase, rooms, contact] = await Promise.all([getKnowledgeBase(), getRooms(), getPropertyContactInfo()]);
  const q = normalize(question);

  const scored = knowledgeBase
    .map((item) => ({ item, score: scoreKnowledgeItem(question, [...item.keywords, item.question.ro, item.question.en]) }))
    .sort((a, b) => b.score - a.score);
  const bestMatch = scored[0]?.score ? scored[0].item : undefined;

  const matchedRoom = rooms.find((r) => q.includes(normalize(r.name.ro)) || q.includes(normalize(r.name.en)));
  // Generic "what rooms do you have" questions (not naming a specific room)
  // get a summary of the whole room lineup instead of a dead end.
  const roomsKeywords = ["camere", "camera", "cazare", "room", "rooms"];
  const asksAboutRoomsGenerically = !matchedRoom && rooms.length > 0 && roomsKeywords.some((k) => q.includes(normalize(k)));

  // The AI Concierge runs inside the authenticated Portal Client, so when a
  // guest asks about "my stay/booking/reservation", ground the answer in
  // *their own* booking data only (never another guest's), matched via the
  // real portal session email — never trusted client input.
  const bookingKeywords = ["rezervarea mea", "sejurul meu", "my booking", "my stay", "my reservation", "cazarea mea"];
  const asksAboutOwnBooking = bookingKeywords.some((k) => q.includes(normalize(k)));
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
  const areaKeywords = ["aproape", "apropiere", "zona", "farmacie", "benzinarie", "atractie", "vizit", "nearby", "area", "pharmacy", "fuel", "visit", "attraction"];
  const asksAboutArea = areaKeywords.some((k) => q.includes(normalize(k)));
  const areaContext = asksAboutArea ? await buildAiAreaContext(locale) : "";

  // Simple, high-intent property questions (facilities, dining, spa, offers,
  // check-in/out, address/contact, booking, WhatsApp) always get a useful,
  // property-grounded answer — they never fall through to a dead-end handoff.
  const restaurantKeywords = ["restaurant", "mic dejun", "breakfast", "cina", "dinner", "pranz", "lunch", "mananc", "manc", "eat", "food"];
  const spaKeywords = ["spa", "wellness", "masaj", "massage", "sauna", "piscina", "pool"];
  const offersKeywords = ["oferte", "oferta", "discount", "reducere", "promotie", "promotii", "offers", "deal", "promo"];
  const checkInOutKeywords = ["check-in", "checkin", "check-out", "checkout", "sosire", "plecare", "ora cazare"];
  const addressKeywords = ["adresa", "unde sunteti", "locatie", "address", "location", "where are you"];
  const bookingCtaKeywords = ["rezervare", "rezerv", "booking", "book now", "disponibilitate", "availability"];
  const whatsappKeywords = ["whatsapp"];
  const greetingKeywords = ["buna", "salut", "hello", "hi", "hey", "servus", "buna ziua"];

  const asksAboutRestaurant = restaurantKeywords.some((k) => q.includes(normalize(k)));
  const asksAboutSpa = spaKeywords.some((k) => q.includes(normalize(k)));
  const asksAboutOffers = offersKeywords.some((k) => q.includes(normalize(k)));
  const asksAboutCheckInOut = checkInOutKeywords.some((k) => q.includes(normalize(k)));
  const asksAboutAddress = addressKeywords.some((k) => q.includes(normalize(k)));
  const asksAboutBooking = bookingCtaKeywords.some((k) => q.includes(normalize(k)));
  const asksAboutWhatsapp = whatsappKeywords.some((k) => q.includes(normalize(k)));
  const isGreeting = q.trim().length < 25 && greetingKeywords.some((k) => q.includes(normalize(k)));

  // 1. Property data from the DB is always available as a grounding
  // baseline, so the concierge never has nothing to work with — this is
  // what lets simple prompts ("Bună", "Camere", "Restaurant") get a real
  // answer instead of an immediate WhatsApp handoff.
  const propertyFact = `Property "${contact.name}", address ${contact.address}. Phone ${contact.phone}, email ${contact.email}. Check-in from ${contact.checkIn}, check-out until ${contact.checkOut}. WhatsApp: https://wa.me/${contact.whatsapp}.`;
  const groundingFacts: string[] = [propertyFact];

  if (areaContext) groundingFacts.push(areaContext);
  if (bestMatch) groundingFacts.push(`Q: ${bestMatch.question[locale] ?? bestMatch.question.en}\nA: ${bestMatch.answer[locale] ?? bestMatch.answer.en}`);
  if (matchedRoom) {
    groundingFacts.push(
      `Room "${matchedRoom.name[locale] ?? matchedRoom.name.en}": from ${formatCurrency(matchedRoom.basePrice)}/night, max ${matchedRoom.maxAdults} adults + ${matchedRoom.maxChildren} children, ${matchedRoom.sizeSqm} m². Amenities: ${matchedRoom.amenities.join(", ")}.`
    );
  }
  if (asksAboutRoomsGenerically) {
    const prices = rooms.map((r) => r.basePrice);
    groundingFacts.push(
      `Rooms available: ${rooms.map((r) => r.name[locale] ?? r.name.en).join(", ")}. Prices from ${formatCurrency(Math.min(...prices))} to ${formatCurrency(Math.max(...prices))} per night.`
    );
  }
  if (asksAboutRestaurant) {
    const facility = seedFacilities.find((f) => f.id === "fac-restaurant");
    if (facility) groundingFacts.push(`Restaurant: ${facility.description[locale] ?? facility.description.en}`);
  }
  if (asksAboutSpa) {
    const spaFacility = seedFacilities.find((f) => f.id === "fac-spa");
    const poolFacility = seedFacilities.find((f) => f.id === "fac-pool");
    if (spaFacility) groundingFacts.push(`Spa & Wellness: ${spaFacility.description[locale] ?? spaFacility.description.en}`);
    if (poolFacility) groundingFacts.push(`Pool: ${poolFacility.description[locale] ?? poolFacility.description.en}`);
  }
  if (asksAboutOffers) {
    const offers = await getOffers();
    if (offers.length > 0) {
      groundingFacts.push(`Current offers: ${offers.map((o) => o.title[locale] ?? o.title.en).join(", ")}.`);
    } else {
      groundingFacts.push(locale === "ro" ? "Nu există oferte speciale active în acest moment." : "There are no active special offers right now.");
    }
  }
  if (asksAboutCheckInOut) groundingFacts.push(`Check-in: ${contact.checkIn}. Check-out: ${contact.checkOut}.`);
  if (asksAboutAddress) groundingFacts.push(`Address: ${contact.address}. Phone: ${contact.phone}.`);
  if (asksAboutBooking) {
    groundingFacts.push(
      locale === "ro"
        ? "Pentru a rezerva, oaspetele poate folosi pagina de rezervare a site-ului (disponibilitate în timp real) sau poate contacta proprietatea direct prin telefon sau WhatsApp."
        : "To book, the guest can use the website's booking page (real-time availability) or contact the property directly by phone or WhatsApp."
    );
  }
  if (asksAboutWhatsapp) groundingFacts.push(`WhatsApp: https://wa.me/${contact.whatsapp}`);
  if (isGreeting) {
    groundingFacts.push(
      locale === "ro"
        ? "Oaspetele tocmai a salutat. Răspunde cald și scurt, prezintă-te ca asistentul AI al proprietății și invită-l să întrebe despre camere, restaurant, spa, oferte sau rezervare."
        : "The guest just said hello. Reply warmly and briefly, introduce yourself as the property's AI assistant, and invite them to ask about rooms, restaurant, spa, offers or booking."
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

  let engineReason: string | undefined;
  if (await isAiConfigured()) {
    const result = await completeChatDetailed([
      {
        role: "system",
        content:
          `You are the AI Concierge for ${dict.common.brand}, a luxury hospitality property. Answer using the facts provided below, in a warm, natural, concierge tone. ` +
          `Reply in ${locale === "ro" ? "Romanian" : "English"}. Never invent information not present in the facts (prices, policies, place names). ` +
          `Always give a helpful, complete answer — never a bare "I don't know" — and when the facts don't fully cover the question, offer to connect the guest with the team on WhatsApp.\n\nFacts:\n${groundingFacts.join("\n\n")}`,
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: question },
    ]);
    if (result.content) return NextResponse.json({ answer: result.content, handoff: false, engine: "openai" });
    engineReason = result.reason;
  } else {
    engineReason = "no_api_key";
  }

  // Deterministic fallback (no API key / API error): prefer the most
  // specific matched fact over the generic property baseline, but there is
  // always at least the property fact — this is never a dead end.
  const fallbackAnswer = bestMatch
    ? bestMatch.answer[locale] ?? bestMatch.answer.en
    : groundingFacts.length > 1
      ? groundingFacts[groundingFacts.length - 1]
      : groundingFacts[0];
  return NextResponse.json({ answer: fallbackAnswer, handoff: false, engine: "rules", engineReason });
}
