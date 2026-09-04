import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { getPool } from "@/lib/db";

export type SqlClient = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ) => Promise<QueryResult<T>>;
};

/** Auth and admin operations bypass RLS via SECURITY DEFINER functions. */
export async function ensureAuthFunctions(client?: SqlClient) {
  const db = client ?? getPool();
  await db.query(`
    CREATE OR REPLACE FUNCTION auth_get_user_by_email(p_email TEXT)
    RETURNS SETOF users
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT * FROM users WHERE LOWER(email) = LOWER(TRIM(p_email)) LIMIT 1;
    $$;

    CREATE OR REPLACE FUNCTION auth_get_user_by_id(p_id TEXT)
    RETURNS SETOF users
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT * FROM users WHERE id = p_id LIMIT 1;
    $$;

    CREATE OR REPLACE FUNCTION auth_create_user(
      p_id TEXT,
      p_email TEXT,
      p_name TEXT,
      p_role TEXT
    )
    RETURNS SETOF users
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      INSERT INTO users (id, email, name, password_hash, email_verified, role, created_at, updated_at)
      VALUES (p_id, LOWER(TRIM(p_email)), NULLIF(TRIM(p_name), ''), NULL, FALSE, p_role, NOW(), NOW())
      RETURNING *;
    $$;

    CREATE OR REPLACE FUNCTION auth_upsert_platform_admin(
      p_id TEXT,
      p_email TEXT,
      p_name TEXT,
      p_password_hash TEXT
    )
    RETURNS SETOF users
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      INSERT INTO users (id, email, name, password_hash, email_verified, role, created_at, updated_at)
      VALUES (p_id, LOWER(TRIM(p_email)), NULLIF(TRIM(p_name), ''), p_password_hash, TRUE, 'platform_admin', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'platform_admin',
        email_verified = TRUE,
        name = COALESCE(EXCLUDED.name, users.name),
        updated_at = NOW()
      RETURNING *;
    $$;

    CREATE OR REPLACE FUNCTION auth_set_user_password(p_id TEXT, p_password_hash TEXT)
    RETURNS VOID
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      UPDATE users SET password_hash = p_password_hash, email_verified = TRUE, updated_at = NOW()
      WHERE id = p_id;
    $$;
  `);
}

export type { PoolClient };
