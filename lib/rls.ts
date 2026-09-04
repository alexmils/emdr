import { AsyncLocalStorage } from "async_hooks";
import type { PoolClient } from "pg";
import type { UserRole } from "./roles";
import { getPool } from "./db";

export type RlsContext = {
  userId: string;
  role: UserRole;
};

const clientStorage = new AsyncLocalStorage<PoolClient>();
const contextStorage = new AsyncLocalStorage<RlsContext>();

export function getRlsContext(): RlsContext {
  const ctx = contextStorage.getStore();
  if (!ctx) {
    throw new Error("RLS context required — wrap calls in withRlsSession()");
  }
  return ctx;
}

export function getRlsClient(): PoolClient | null {
  return clientStorage.getStore() ?? null;
}

export async function dbQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) {
  const client = getRlsClient();
  if (client) return client.query<T>(text, params);
  return getPool().query<T>(text, params);
}

export async function withRlsSession<T>(
  ctx: RlsContext,
  fn: () => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [
      ctx.userId,
    ]);
    await client.query(`SELECT set_config('app.current_user_role', $1, true)`, [
      ctx.role,
    ]);
    const result = await contextStorage.run(ctx, () =>
      clientStorage.run(client, fn)
    );
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
