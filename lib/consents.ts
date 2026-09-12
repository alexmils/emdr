import { randomUUID } from "crypto";
import { dbQuery } from "@/lib/rls";
import {
  allInformedKeysAccepted,
  type InformedConsentKey,
  requiredConsentVersions,
  SESSION_REQUIRED_DOC_TYPES,
} from "@/lib/consents-shared";
import {
  LEGAL_DOC_VERSION,
  type LegalDocType,
} from "@/lib/legal-entity";

export type {
  InformedConsentKey,
} from "@/lib/consents-shared";
export {
  allInformedKeysAccepted,
  INFORMED_CONSENT_KEYS,
  requiredConsentVersions,
  SESSION_REQUIRED_DOC_TYPES,
} from "@/lib/consents-shared";

export type ConsentRow = {
  id: string;
  userId: string;
  docType: LegalDocType;
  docVersion: string;
  acceptedAt: string;
  ip: string | null;
  userAgent: string | null;
  detail: Record<string, unknown> | null;
};

type ConsentDb = {
  id: string;
  user_id: string;
  doc_type: string;
  doc_version: string;
  accepted_at: Date | string;
  ip: string | null;
  user_agent: string | null;
  detail: unknown;
};

function mapRow(r: ConsentDb): ConsentRow {
  return {
    id: r.id,
    userId: r.user_id,
    docType: r.doc_type as LegalDocType,
    docVersion: r.doc_version,
    acceptedAt:
      typeof r.accepted_at === "string"
        ? r.accepted_at
        : r.accepted_at.toISOString(),
    ip: r.ip,
    userAgent: r.user_agent,
    detail:
      r.detail && typeof r.detail === "object"
        ? (r.detail as Record<string, unknown>)
        : null,
  };
}

export async function listConsentsForUser(
  userId: string
): Promise<ConsentRow[]> {
  const { rows } = await dbQuery<ConsentDb>(
    `SELECT * FROM consents WHERE user_id = $1 ORDER BY accepted_at DESC`,
    [userId]
  );
  return rows.map(mapRow);
}

export async function hasConsent(
  userId: string,
  docType: LegalDocType,
  docVersion: string
): Promise<boolean> {
  const { rows } = await dbQuery<{ id: string }>(
    `SELECT id FROM consents
     WHERE user_id = $1 AND doc_type = $2 AND doc_version = $3
     LIMIT 1`,
    [userId, docType, docVersion]
  );
  return rows.length > 0;
}

export async function hasRequiredConsents(userId: string): Promise<boolean> {
  const required = requiredConsentVersions();
  for (const [docType, version] of Object.entries(required) as [
    LegalDocType,
    string,
  ][]) {
    if (!(await hasConsent(userId, docType, version))) return false;
  }
  return true;
}

export type RecordConsentInput = {
  userId: string;
  docType: LegalDocType;
  docVersion: string;
  ip?: string | null;
  userAgent?: string | null;
  detail?: Record<string, unknown> | null;
};

export async function recordConsent(
  input: RecordConsentInput
): Promise<ConsentRow> {
  const id = randomUUID();
  const { rows } = await dbQuery<ConsentDb>(
    `INSERT INTO consents (
       id, user_id, doc_type, doc_version, accepted_at, ip, user_agent, detail
     ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7::jsonb)
     RETURNING *`,
    [
      id,
      input.userId,
      input.docType,
      input.docVersion,
      input.ip ?? null,
      input.userAgent ?? null,
      JSON.stringify(input.detail ?? {}),
    ]
  );
  return mapRow(rows[0]!);
}

/**
 * Record age_18 + informed_session + current terms/privacy for audit trail.
 */
export async function recordInformedSessionBundle(opts: {
  userId: string;
  checks: Record<InformedConsentKey, boolean>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<ConsentRow[]> {
  if (!allInformedKeysAccepted(opts.checks)) {
    throw new Error("All informed-consent attestations are required");
  }

  const meta = {
    checks: opts.checks,
    recordedAt: new Date().toISOString(),
  };

  const rows: ConsentRow[] = [];
  for (const docType of [
    "age_18",
    "informed_session",
    "terms",
    "privacy",
  ] as const) {
    rows.push(
      await recordConsent({
        userId: opts.userId,
        docType,
        docVersion: LEGAL_DOC_VERSION[docType],
        ip: opts.ip,
        userAgent: opts.userAgent,
        detail: meta,
      })
    );
  }
  return rows;
}
