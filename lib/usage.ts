import { ensureSchemaReady, getPool } from "@/lib/db";
import { ensureLlmUsageSchema } from "@/lib/llm-usage";

export type UserUsageRow = {
  userId: string;
  email: string;
  name: string | null;
  threadCount: number;
  messageCount: number;
  lastActivityAt: string | null;
  llmCallCount: number;
  llmPromptTokens: number;
  llmCompletionTokens: number;
  llmTotalTokens: number;
  llmCostUsdMicros: number;
  /** ElevenLabs billed characters (stored as tokens). */
  voiceChars: number;
  voiceCallCount: number;
  voiceCostUsdMicros: number;
};

export async function listUserUsage(limit = 50): Promise<UserUsageRow[]> {
  await ensureSchemaReady();
  await ensureLlmUsageSchema();
  const { rows } = await getPool().query<{
    user_id: string;
    email: string;
    name: string | null;
    thread_count: number;
    message_count: number;
    last_activity: string | null;
    llm_call_count: number;
    llm_prompt_tokens: string;
    llm_completion_tokens: string;
    llm_total_tokens: string;
    llm_cost_usd_micros: string;
    voice_chars: string;
    voice_call_count: number;
    voice_cost_usd_micros: string;
  }>(
    `SELECT u.id AS user_id, u.email, u.name,
            COUNT(DISTINCT t.id)::int AS thread_count,
            COUNT(m.id)::int AS message_count,
            MAX(GREATEST(t.updated_at, m.created_at)) AS last_activity,
            COALESCE(lu.llm_call_count, 0)::int AS llm_call_count,
            COALESCE(lu.llm_prompt_tokens, 0) AS llm_prompt_tokens,
            COALESCE(lu.llm_completion_tokens, 0) AS llm_completion_tokens,
            COALESCE(lu.llm_total_tokens, 0) AS llm_total_tokens,
            COALESCE(lu.llm_cost_usd_micros, 0) AS llm_cost_usd_micros,
            COALESCE(lu.voice_chars, 0) AS voice_chars,
            COALESCE(lu.voice_call_count, 0)::int AS voice_call_count,
            COALESCE(lu.voice_cost_usd_micros, 0) AS voice_cost_usd_micros
     FROM users u
     LEFT JOIN threads t ON t.user_id = u.id
     LEFT JOIN messages m ON m.thread_id = t.id
     LEFT JOIN (
       SELECT user_id,
              COUNT(*) FILTER (WHERE purpose <> 'voice')::int AS llm_call_count,
              SUM(prompt_tokens) FILTER (WHERE purpose <> 'voice') AS llm_prompt_tokens,
              SUM(completion_tokens) FILTER (WHERE purpose <> 'voice') AS llm_completion_tokens,
              SUM(total_tokens) FILTER (WHERE purpose <> 'voice') AS llm_total_tokens,
              SUM(cost_usd_micros) FILTER (WHERE purpose <> 'voice') AS llm_cost_usd_micros,
              SUM(total_tokens) FILTER (WHERE purpose = 'voice') AS voice_chars,
              COUNT(*) FILTER (WHERE purpose = 'voice')::int AS voice_call_count,
              SUM(cost_usd_micros) FILTER (WHERE purpose = 'voice') AS voice_cost_usd_micros
       FROM llm_usage_events
       GROUP BY user_id
     ) lu ON lu.user_id = u.id
     GROUP BY u.id, u.email, u.name,
              lu.llm_call_count, lu.llm_prompt_tokens, lu.llm_completion_tokens,
              lu.llm_total_tokens, lu.llm_cost_usd_micros,
              lu.voice_chars, lu.voice_call_count, lu.voice_cost_usd_micros
     ORDER BY COALESCE(lu.llm_cost_usd_micros, 0) + COALESCE(lu.voice_cost_usd_micros, 0) DESC,
              COUNT(m.id) DESC,
              u.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return rows.map((r) => ({
    userId: r.user_id,
    email: r.email,
    name: r.name,
    threadCount: r.thread_count,
    messageCount: r.message_count,
    lastActivityAt: r.last_activity
      ? new Date(r.last_activity).toISOString()
      : null,
    llmCallCount: Number(r.llm_call_count),
    llmPromptTokens: Number(r.llm_prompt_tokens),
    llmCompletionTokens: Number(r.llm_completion_tokens),
    llmTotalTokens: Number(r.llm_total_tokens),
    llmCostUsdMicros: Number(r.llm_cost_usd_micros),
    voiceChars: Number(r.voice_chars),
    voiceCallCount: Number(r.voice_call_count),
    voiceCostUsdMicros: Number(r.voice_cost_usd_micros),
  }));
}
