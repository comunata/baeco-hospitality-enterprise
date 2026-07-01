import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRooms } from "@/lib/data/rooms";
import { completeChat, isAiConfigured } from "@/lib/integrations/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/utils";
import type { Room } from "@/lib/types";

const requestSchema = z.object({
  locale: z.string().optional(),
  adults: z.number().int().min(1).max(20).optional(),
  children: z.number().int().min(0).max(20).optional(),
  budgetPerNight: z.number().min(0).max(100000).optional(),
  preferences: z.string().max(500).optional(),
});

function describeRoom(room: Room, locale: Locale): string {
  return (
    `id=${room.id} | "${room.name[locale] ?? room.name.en}" | ${formatCurrency(room.basePrice)}/noapte | ` +
    `max ${room.maxAdults} adulți + ${room.maxChildren} copii | ${room.sizeSqm} m² | paturi: ${room.beds.join(", ")} | ` +
    `dotări: ${room.amenities.join(", ")} | descriere: ${room.description[locale] ?? room.description.en}`
  );
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "ai-room-finder", { maxRequests: 15, windowMs: 60_000 });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { adults, children, budgetPerNight, preferences } = parsed.data;
  const locale = isLocale(parsed.data.locale ?? "") ? (parsed.data.locale as Locale) : defaultLocale;
  const dict = getDictionary(locale);

  const rooms = await getRooms();

  // Real, grounded pre-filter — never let the LLM invent capacity/pricing
  // that doesn't exist. Filter by hard constraints first, then let the
  // model rank/explain among the real candidates.
  let candidates = rooms;
  if (adults !== undefined) candidates = candidates.filter((r) => r.maxAdults >= adults);
  if (children !== undefined) candidates = candidates.filter((r) => r.maxChildren >= children);
  if (budgetPerNight !== undefined) candidates = candidates.filter((r) => r.basePrice <= budgetPerNight);

  // If hard filters eliminate everything, fall back to the full real list so
  // the assistant can still explain trade-offs (e.g. "nothing fits your
  // budget, closest options are X and Y") instead of returning nothing.
  const pool = candidates.length > 0 ? candidates : rooms;

  if (pool.length === 0) {
    return NextResponse.json({ answer: dict.ai.roomFinder.noResults, rooms: [] });
  }

  const roomFacts = pool.map((r) => describeRoom(r, locale)).join("\n");

  if (await isAiConfigured()) {
    const answer = await completeChat([
      {
        role: "system",
        content:
          `You are the AI Room Finder for ${dict.common.brand}, a luxury hospitality property. ` +
          `Recommend 1-3 rooms from the REAL room list below ONLY — never invent a room id, price, or capacity. ` +
          `Always reference rooms by their exact id and name from the list. Explain briefly why each recommended room fits ` +
          `the guest's stated preferences (people count, budget, view/balcony/quiet/other wishes). Reply in ${locale === "ro" ? "Romanian" : "English"}.\n\n` +
          `Real available rooms:\n${roomFacts}`,
      },
      {
        role: "user",
        content:
          `Adulți: ${adults ?? "nespecificat"}. Copii: ${children ?? "nespecificat"}. ` +
          `Buget/noapte: ${budgetPerNight !== undefined ? formatCurrency(budgetPerNight) : "nespecificat"}. ` +
          `Dorințe: ${preferences?.trim() || "nespecificate"}.`,
      },
    ]);
    if (answer) {
      return NextResponse.json({
        answer,
        rooms: pool.slice(0, 3).map((r) => ({ id: r.id, slug: r.slug, name: r.name[locale] ?? r.name.en, price: r.basePrice })),
      });
    }
  }

  // Deterministic fallback (no AI key configured): simplest real match —
  // cheapest room among the filtered candidates.
  const sorted = [...pool].sort((a, b) => a.basePrice - b.basePrice).slice(0, 3);
  const fallbackAnswer = sorted
    .map((r) => `${r.name[locale] ?? r.name.en} — ${formatCurrency(r.basePrice)}/noapte, max ${r.maxAdults}+${r.maxChildren}, ${r.sizeSqm} m².`)
    .join("\n");
  return NextResponse.json({
    answer: fallbackAnswer,
    rooms: sorted.map((r) => ({ id: r.id, slug: r.slug, name: r.name[locale] ?? r.name.en, price: r.basePrice })),
  });
}
