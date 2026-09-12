import webpush from "web-push";
import { ensureSchemaReady, getPool } from "@/lib/db";
import { safeAdminPushPath } from "@/lib/admin-push-url";
import {
  getPlatformSettings,
  savePlatformSettings,
} from "@/lib/platform-settings";

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

type VapidKeys = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

let pushSchemaDone = false;

export async function ensureAdminPushSchema(): Promise<void> {
  await ensureSchemaReady();
  if (pushSchemaDone) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_push_endpoint
      ON admin_push_subscriptions(endpoint);
    CREATE INDEX IF NOT EXISTS idx_admin_push_user
      ON admin_push_subscriptions(user_id);
  `);
  pushSchemaDone = true;
}

function envVapid(): VapidKeys | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
  if (!publicKey || !privateKey) return null;
  const subject =
    process.env.VAPID_SUBJECT?.trim() ||
    process.env.APP_URL?.trim() ||
    "mailto:admin@nurahelp.com";
  return { publicKey, privateKey, subject };
}

function readStoredVapid(platform: {
  adminPush?: { publicKey: string; privateKey: string; subject: string };
}): VapidKeys | null {
  const r = platform.adminPush;
  if (!r) return null;
  const publicKey = r.publicKey?.trim() || "";
  const privateKey = r.privateKey?.trim() || "";
  if (!publicKey || !privateKey) return null;
  const subject =
    r.subject?.trim() ||
    process.env.APP_URL?.trim() ||
    "mailto:admin@nurahelp.com";
  return { publicKey, privateKey, subject };
}

/** Resolve or create VAPID keys (env wins; else platform settings). */
export async function getOrCreateVapidKeys(): Promise<VapidKeys> {
  const fromEnv = envVapid();
  if (fromEnv) return fromEnv;

  const platform = await getPlatformSettings();
  const stored = readStoredVapid(platform);
  if (stored) return stored;

  // Serialize first-boot generate across concurrent Alerts GET + help push.
  const db = getPool();
  await db.query(`SELECT pg_advisory_lock(hashtext('nura-admin-vapid'))`);
  try {
    const again = await getPlatformSettings();
    const existing = readStoredVapid(again);
    if (existing) return existing;

    const generated = webpush.generateVAPIDKeys();
    const subject =
      process.env.APP_URL?.trim() || "mailto:admin@nurahelp.com";
    await savePlatformSettings({
      ...again,
      adminPush: {
        publicKey: generated.publicKey,
        privateKey: generated.privateKey,
        subject,
      },
    });
    return {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
      subject,
    };
  } finally {
    await db.query(`SELECT pg_advisory_unlock(hashtext('nura-admin-vapid'))`);
  }
}

export async function getVapidPublicKey(): Promise<string> {
  const keys = await getOrCreateVapidKeys();
  return keys.publicKey;
}

function configureWebPush(keys: VapidKeys): void {
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
}

export async function saveAdminPushSubscription(input: {
  userId: string;
  subscription: PushSubscriptionJSON;
  userAgent?: string | null;
}): Promise<void> {
  await ensureAdminPushSchema();
  const endpoint = input.subscription.endpoint?.trim();
  const p256dh = input.subscription.keys?.p256dh?.trim();
  const auth = input.subscription.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    throw new Error("Invalid push subscription");
  }
  const db = getPool();
  await db.query(
    `INSERT INTO admin_push_subscriptions
       (id, user_id, endpoint, p256dh, auth, user_agent, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
     ON CONFLICT (endpoint) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth,
       user_agent = EXCLUDED.user_agent,
       updated_at = NOW()`,
    [
      crypto.randomUUID(),
      input.userId,
      endpoint,
      p256dh,
      auth,
      input.userAgent?.slice(0, 300) ?? null,
    ]
  );
}

export async function deleteAdminPushSubscription(input: {
  userId: string;
  endpoint?: string;
}): Promise<void> {
  await ensureAdminPushSchema();
  const db = getPool();
  if (input.endpoint?.trim()) {
    await db.query(
      `DELETE FROM admin_push_subscriptions
       WHERE user_id = $1 AND endpoint = $2`,
      [input.userId, input.endpoint.trim()]
    );
    return;
  }
  await db.query(
    `DELETE FROM admin_push_subscriptions WHERE user_id = $1`,
    [input.userId]
  );
}

export async function hasAdminPushSubscription(
  userId: string
): Promise<boolean> {
  await ensureAdminPushSchema();
  const { rows } = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM admin_push_subscriptions
     WHERE user_id = $1`,
    [userId]
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

export async function sendAdminHelpPush(input: {
  title: string;
  body: string;
  url: string;
  tag?: string;
}): Promise<void> {
  await ensureAdminPushSchema();
  const keys = await getOrCreateVapidKeys();
  configureWebPush(keys);

  const { rows } = await getPool().query<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }>(
    `SELECT s.id, s.endpoint, s.p256dh, s.auth
     FROM admin_push_subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE u.role IN ('platform_admin','support') AND u.status = 'active'`
  );
  if (!rows.length) return;

  const url = safeAdminPushPath(
    input.url,
    process.env.APP_URL?.trim() || "https://nurahelp.com"
  );

  const payload = JSON.stringify({
    title: input.title.slice(0, 80),
    body: input.body.slice(0, 160),
    url,
    tag: input.tag || "help-chat",
  });

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        payload
      );
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "statusCode" in err
          ? Number((err as { statusCode?: number }).statusCode)
          : 0;
      if (status === 404 || status === 410) {
        await getPool().query(
          `DELETE FROM admin_push_subscriptions WHERE id = $1`,
          [row.id]
        );
      } else {
        console.error("[admin/push]", row.endpoint.slice(0, 48), err);
      }
    }
  }
}
