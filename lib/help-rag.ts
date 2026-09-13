import type { ChatMessage } from "@/lib/llm";
import {
  getHelpSettings,
  HELP_PRICES_URL,
  listKnowledge,
  type HelpSettings,
} from "@/lib/help-db";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length > 2);
}

export type HelpDocSnippet = {
  title: string;
  body: string;
  tags: string[];
};

/** Rank knowledge docs by keyword overlap (pure; used by RAG + tests). */
export function rankKnowledgeDocs(
  query: string,
  docs: HelpDocSnippet[],
  limit = 4
): HelpDocSnippet[] {
  if (!docs.length) return [];
  const qTokens = new Set(tokenize(query));
  if (!qTokens.size) return docs.slice(0, limit);

  const scored = docs
    .map((d) => {
      const hay = tokenize(`${d.title} ${d.body} ${d.tags.join(" ")}`);
      let score = 0;
      for (const t of hay) {
        if (qTokens.has(t)) score += 1;
      }
      return { d, score };
    })
    .sort((a, b) => b.score - a.score);

  const picked = scored.filter((s) => s.score > 0).slice(0, limit);
  if (picked.length) return picked.map((s) => s.d);
  return scored.slice(0, Math.min(2, scored.length)).map((s) => s.d);
}

/** Lightweight keyword RAG over admin knowledge docs (no vector DB required). */
export async function retrieveHelpContext(
  query: string,
  limit = 4
): Promise<string> {
  const docs = await listKnowledge(false);
  const ranked = rankKnowledgeDocs(query, docs, limit);
  return ranked.map((d) => `### ${d.title}\n${d.body}`).join("\n\n");
}

export function buildHelpSystemPrompt(
  settings: HelpSettings,
  ragContext: string
): string {
  return [
    "You are the Nura product support assistant in a small help chat.",
    "Answer briefly, in plain English, sentence case.",
    "Only discuss the product: account, billing, trial, sessions, session controls, privacy basics, and troubleshooting.",
    "If the user asks for therapy, diagnosis, medical advice, or crisis help: refuse politely, redirect to professionals / emergency services, and stay short.",
    "Do not invent billing charges, dollar amounts, or policies. If unsure, say a human teammate can follow up.",
    "Never name payment processors or payment brands. Say Billing or Manage billing in the app.",
    `When asked about price, cost, plans, or how much Nura costs: reply with a short line and include this markdown link — [See current prices](${HELP_PRICES_URL}). That page lists current plans. Do not send people to a customer portal just to see prices.`,
    "Cancel or change a paid plan (signed-in): Billing → Manage billing in the app — still never name the payment vendor.",
    "",
    "ALLOWED TOPICS:",
    settings.allowedTopics || "(none listed)",
    "",
    "MUST NOT DISCUSS:",
    settings.deniedTopics || "(none listed)",
    "",
    settings.extraSystemNotes?.trim()
      ? `EXTRA ADMIN NOTES:\n${settings.extraSystemNotes.trim()}\n`
      : "",
    "KNOWLEDGE BASE (use when relevant):",
    ragContext || "(empty)",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function buildHelpAiMessages(input: {
  history: { role: "user" | "assistant" | "admin"; content: string }[];
  latestUserMessage: string;
}): Promise<ChatMessage[]> {
  const settings = await getHelpSettings();
  const rag = await retrieveHelpContext(input.latestUserMessage);
  const system = buildHelpSystemPrompt(settings, rag);

  const history: ChatMessage[] = input.history
    .filter(
      (m) => m.role === "user" || m.role === "assistant" || m.role === "admin"
    )
    .slice(-12)
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content:
        m.role === "admin" ? `[Human support]: ${m.content}` : m.content,
    }));

  return [
    { role: "system", content: system },
    ...history,
    { role: "user", content: input.latestUserMessage },
  ];
}
