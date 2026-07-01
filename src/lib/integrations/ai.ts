import "server-only";

const openaiApiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

export async function completeChat(messages: AiChatMessage[]): Promise<string | null> {
  if (!openaiApiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 500 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
