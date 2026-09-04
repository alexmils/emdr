import { dbQuery } from "@/lib/rls";
import type { SqlClient } from "@/lib/auth/db-auth";

type QueryFn = SqlClient["query"];

export async function ensureRlsPolicies(client?: SqlClient) {
  const query: QueryFn = client
    ? (text, params) => client.query(text, params)
    : (text, params) => dbQuery(text, params);

  await query(`
    CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS TEXT AS $$
      SELECT NULLIF(current_setting('app.current_user_id', true), '');
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION app_current_user_role() RETURNS TEXT AS $$
      SELECT NULLIF(current_setting('app.current_user_role', true), '');
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION app_is_platform_admin() RETURNS BOOLEAN AS $$
      SELECT app_current_user_role() = 'platform_admin';
    $$ LANGUAGE sql STABLE;
  `);

  const tables = [
    "threads",
    "messages",
    "memories",
    "memory_sets",
    "memory_set_items",
    "thread_memory_sets",
    "user_settings",
  ];

  for (const table of tables) {
    await query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  }

  await query(`
    DROP POLICY IF EXISTS threads_all ON threads;
    CREATE POLICY threads_all ON threads FOR ALL USING (
      user_id = app_current_user_id()
    ) WITH CHECK (
      user_id = app_current_user_id()
    );

    DROP POLICY IF EXISTS messages_all ON messages;
    CREATE POLICY messages_all ON messages FOR ALL USING (
      EXISTS (
        SELECT 1 FROM threads t
        WHERE t.id = messages.thread_id AND t.user_id = app_current_user_id()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM threads t
        WHERE t.id = messages.thread_id AND t.user_id = app_current_user_id()
      )
    );

    DROP POLICY IF EXISTS memories_all ON memories;
    CREATE POLICY memories_all ON memories FOR ALL USING (
      user_id = app_current_user_id()
    ) WITH CHECK (
      user_id = app_current_user_id()
    );

    DROP POLICY IF EXISTS memory_sets_all ON memory_sets;
    CREATE POLICY memory_sets_all ON memory_sets FOR ALL USING (
      user_id = app_current_user_id()
    ) WITH CHECK (
      user_id = app_current_user_id()
    );

    DROP POLICY IF EXISTS memory_set_items_all ON memory_set_items;
    CREATE POLICY memory_set_items_all ON memory_set_items FOR ALL USING (
      EXISTS (
        SELECT 1 FROM memory_sets ms
        WHERE ms.id = memory_set_items.set_id AND ms.user_id = app_current_user_id()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM memory_sets ms
        WHERE ms.id = memory_set_items.set_id AND ms.user_id = app_current_user_id()
      )
    );

    DROP POLICY IF EXISTS thread_memory_sets_all ON thread_memory_sets;
    CREATE POLICY thread_memory_sets_all ON thread_memory_sets FOR ALL USING (
      EXISTS (
        SELECT 1 FROM threads t
        WHERE t.id = thread_memory_sets.thread_id AND t.user_id = app_current_user_id()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM threads t
        WHERE t.id = thread_memory_sets.thread_id AND t.user_id = app_current_user_id()
      )
    );

    DROP POLICY IF EXISTS user_settings_all ON user_settings;
    CREATE POLICY user_settings_all ON user_settings FOR ALL USING (
      user_id = app_current_user_id()
    ) WITH CHECK (
      user_id = app_current_user_id()
    );
  `);
}

export async function migrateOrphanDataToUser(userId: string) {
  await dbQuery(
    "UPDATE threads SET user_id = $1 WHERE user_id IS NULL",
    [userId]
  );
  await dbQuery(
    "UPDATE memories SET user_id = $1 WHERE user_id IS NULL",
    [userId]
  );
  await dbQuery(
    "UPDATE memory_sets SET user_id = $1 WHERE user_id IS NULL",
    [userId]
  );
}

export async function migrateLegacySettings(userId: string) {
  const { rows } = await dbQuery<{ json: unknown }>(
    "SELECT json FROM app_settings WHERE id = 1"
  );
  if (rows[0]) {
    await dbQuery(
      `INSERT INTO user_settings (user_id, json) VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, rows[0].json]
    );
  }
}
