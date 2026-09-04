import { getPool, ensureSchemaReady } from "@/lib/db";

export type PasskeyTransport =
  | "ble"
  | "cable"
  | "hybrid"
  | "internal"
  | "nfc"
  | "smart-card"
  | "usb";

export type PasskeyCredential = {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: PasskeyTransport[];
  deviceType: string;
  backedUp: boolean;
  friendlyName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

function rowToPasskey(row: Record<string, unknown>): PasskeyCredential {
  const transportsRaw = row.transports;
  let transports: PasskeyTransport[] = [];
  if (Array.isArray(transportsRaw)) {
    transports = transportsRaw as PasskeyTransport[];
  } else if (typeof transportsRaw === "string") {
    try {
      transports = JSON.parse(transportsRaw) as PasskeyTransport[];
    } catch {
      transports = [];
    }
  }

  return {
    id: row.id as string,
    userId: row.user_id as string,
    credentialId: row.credential_id as string,
    publicKey: row.public_key as string,
    counter: Number(row.counter ?? 0),
    transports,
    deviceType: (row.device_type as string) ?? "singleDevice",
    backedUp: Boolean(row.backed_up),
    friendlyName: (row.friendly_name as string) ?? null,
    createdAt: new Date(row.created_at as string).toISOString(),
    lastUsedAt: row.last_used_at
      ? new Date(row.last_used_at as string).toISOString()
      : null,
  };
}

export function publicPasskey(p: PasskeyCredential) {
  return {
    id: p.id,
    friendlyName: p.friendlyName,
    deviceType: p.deviceType,
    backedUp: p.backedUp,
    createdAt: p.createdAt,
    lastUsedAt: p.lastUsedAt,
  };
}

export async function listPasskeysForUser(
  userId: string
): Promise<PasskeyCredential[]> {
  await ensureSchemaReady();
  const { rows } = await getPool().query(
    `SELECT * FROM webauthn_credentials WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(rowToPasskey);
}

export async function getPasskeyByCredentialId(
  credentialId: string
): Promise<PasskeyCredential | null> {
  await ensureSchemaReady();
  const { rows } = await getPool().query(
    `SELECT * FROM webauthn_credentials WHERE credential_id = $1`,
    [credentialId]
  );
  return rows[0] ? rowToPasskey(rows[0]) : null;
}

export async function savePasskey(input: {
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: PasskeyTransport[];
  deviceType: string;
  backedUp: boolean;
  friendlyName?: string;
}): Promise<PasskeyCredential> {
  await ensureSchemaReady();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await getPool().query(
    `INSERT INTO webauthn_credentials
      (id, user_id, credential_id, public_key, counter, transports, device_type, backed_up, friendly_name, created_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)`,
    [
      id,
      input.userId,
      input.credentialId,
      input.publicKey,
      input.counter,
      JSON.stringify(input.transports ?? []),
      input.deviceType,
      input.backedUp,
      input.friendlyName ?? "Passkey",
      now,
    ]
  );
  return (await getPasskeyByCredentialId(input.credentialId))!;
}

export async function updatePasskeyCounter(
  credentialId: string,
  counter: number
) {
  await ensureSchemaReady();
  await getPool().query(
    `UPDATE webauthn_credentials
     SET counter = $1, last_used_at = NOW()
     WHERE credential_id = $2`,
    [counter, credentialId]
  );
}

export async function deletePasskey(id: string, userId: string) {
  await ensureSchemaReady();
  await getPool().query(
    `DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
}

export async function renamePasskey(
  id: string,
  userId: string,
  friendlyName: string
) {
  await ensureSchemaReady();
  await getPool().query(
    `UPDATE webauthn_credentials SET friendly_name = $1
     WHERE id = $2 AND user_id = $3`,
    [friendlyName.trim() || "Passkey", id, userId]
  );
}
