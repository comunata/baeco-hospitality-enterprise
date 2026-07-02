import "server-only";

const openaiApiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AiFailureReason = "no_api_key" | "invalid_key" | "rate_limited" | "api_error" | "timeout";

export interface AiChatResult {
  content: string | null;
  reason?: AiFailureReason;
  status?: number;
}

/**
 * Thin OpenAI chat-completions wrapper. When OPENAI_API_KEY isn't set the
 * concierge and local-guide routes fall back to deterministic
 * knowledge-base/keyword matching (see api/ai/*), so both AI modules stay
 * fully usable without an API key — never inventing facts, per spec.
 */
export async function isAiConfigured(): Promise<boolean> {
  return Boolean(openaiApiKey);
}

/** Like completeChat but reports WHY a call failed, for diagnostics and
 * the `engineReason` field on AI route responses. Failures are also logged
 * to the server console so they show up in Netlify function logs. */
export async function completeChatDetailed(messages: AiChatMessage[]): Promise<AiChatResult> {
  if (!openaiApiKey) return { content: null, reason: "no_api_key" };
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 600 }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[ai] OpenAI call failed: status=${res.status} model=${model} body=${body.slice(0, 300)}`);
      const reason: AiFailureReason = res.status === 401 || res.status === 403 ? "invalid_key" : res.status === 429 ? "rate_limited" : "api_error";
      return { content: null, reason, status: res.status };
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? null;
    if (!content) console.error(`[ai] OpenAI returned no content: ${JSON.stringify(data).slice(0, 300)}`);
    return { content };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    console.error(`[ai] OpenAI call threw: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`);
    return { content: null, reason: isTimeout ? "timeout" : "api_error" };
  }
}

export async function completeChat(messages: AiChatMessage[]): Promise<string | null> {
  const result = await completeChatDetailed(messages);
  return result.content;
}
