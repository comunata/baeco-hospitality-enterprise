import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { completeChatDetailed, isAiConfigured } from "@/lib/integrations/ai";

/**
 * AI wiring diagnostics — answers "is OpenAI actually being called in this
 * environment, and if not, why?" without exposing any secret.
 *
 *   GET /api/ai/diagnostics        → config only (no API call)
 *   GET /api/ai/diagnostics?test=1 → also makes a minimal live API call
 *
 * Returns only booleans/statuses; never the key itself.
 */
export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, "ai-diagnostics", { maxRequests: 5, windowMs: 60_000 });
  if (limited) return limited;

  const configured = await isAiConfigured();
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (request.nextUrl.searchParams.get("test") !== "1") {
    return NextResponse.json({ openaiKeyPresent: configured, model });
  }

  if (!configured) {
    return NextResponse.json({ openaiKeyPresent: false, model, testCall: { ok: false, reason: "no_api_key" } });
  }

  const result = await completeChatDetailed([
    { role: "system", content: "Reply with exactly: ok" },
    { role: "user", content: "ping" },
  ]);

  return NextResponse.json({
    openaiKeyPresent: true,
    model,
    testCall: result.content
      ? { ok: true }
      : { ok: false, reason: result.reason, status: result.status },
  });
}
