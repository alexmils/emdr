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
  }>(
    `SELECT u.id AS user_id, u.email, u.name,
            COUNT(DISTINCT t.id)::int AS thread_count,
            COUNT(m.id)::int AS message_count,
            MAX(GREATEST(t.updated_at, m.created_at)) AS last_activity,
            COALESCE(lu.call_count, 0)::int AS llm_call_count,
            COALESCE(lu.prompt_tokens, 0) AS llm_prompt_tokens,
            COALESCE(lu.completion_tokens, 0) AS llm_completion_tokens,
            COALESCE(lu.total_tokens, 0) AS llm_total_tokens,
            COALESCE(lu.cost_usd_micros, 0) AS llm_cost_usd_micros
     FROM users u
     LEFT JOIN threads t ON t.user_id = u.id
     LEFT JOIN messages m ON m.thread_id = t.id
     LEFT JOIN (
       SELECT user_id,
              COUNT(*)::int AS call_count,
              SUM(prompt_tokens) AS prompt_tokens,
              SUM(completion_tokens) AS completion_tokens,
              SUM(total_tokens) AS total_tokens,
              SUM(cost_usd_micros) AS cost_usd_micros
       FROM llm_usage_events
       GROUP BY user_id
     ) lu ON lu.user_id = u.id
     GROUP BY u.id, u.email, u.name,
              lu.call_count, lu.prompt_tokens, lu.completion_tokens,
              lu.total_tokens, lu.cost_usd_micros
     ORDER BY COALESCE(lu.cost_usd_micros, 0) DESC,
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
  }));
}
