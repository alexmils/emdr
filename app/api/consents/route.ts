import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-auth";
import { clientIp } from "@/lib/audit-log";
import {
  allInformedKeysAccepted,
  hasRequiredConsents,
  listConsentsForUser,
  recordConsent,
  recordInformedSessionBundle,
  type InformedConsentKey,
  INFORMED_CONSENT_KEYS,
} from "@/lib/consents";
import {
  LEGAL_DOC_VERSION,
  type LegalDocType,
} from "@/lib/legal-entity";

export async function GET() {
  return withAuth(async (ctx) => {
    const [requiredOk, consents] = await Promise.all([
      hasRequiredConsents(ctx.user.id),
      listConsentsForUser(ctx.user.id),
    ]);
    return NextResponse.json({
      requiredOk,
      versions: LEGAL_DOC_VERSION,
      consents: consents.map((c) => ({
        id: c.id,
        docType: c.docType,
        docVersion: c.docVersion,
        acceptedAt: c.acceptedAt,
      })),
    });
  });
}

export async function POST(request: Request) {
  return withAuth(async (ctx) => {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      docType?: string;
      checks?: Partial<Record<InformedConsentKey, boolean>>;
    };

    const ip = clientIp(request);
    const userAgent = request.headers.get("user-agent");

    if (body.action === "informed_session") {
      const checks = body.checks ?? {};
      if (!allInformedKeysAccepted(checks)) {
        return NextResponse.json(
          {
            error: "Confirm every statement before continuing",
            code: "consent_incomplete",
            keys: INFORMED_CONSENT_KEYS,
          },
          { status: 400 }
        );
      }
      const rows = await recordInformedSessionBundle({
        userId: ctx.user.id,
        checks: checks as Record<InformedConsentKey, boolean>,
        ip,
        userAgent,
      });
      return NextResponse.json({
        requiredOk: true,
        recorded: rows.map((r) => ({
          docType: r.docType,
          docVersion: r.docVersion,
          acceptedAt: r.acceptedAt,
        })),
      });
    }

    if (body.action === "age_18") {
      const row = await recordConsent({
        userId: ctx.user.id,
        docType: "age_18",
        docVersion: LEGAL_DOC_VERSION.age_18,
        ip,
        userAgent,
        detail: { source: "explicit" },
      });
      const requiredOk = await hasRequiredConsents(ctx.user.id);
      return NextResponse.json({
        requiredOk,
        recorded: [
          {
            docType: row.docType,
            docVersion: row.docVersion,
            acceptedAt: row.acceptedAt,
          },
        ],
      });
    }

    if (
      body.action === "record" &&
      (body.docType === "terms" || body.docType === "privacy")
    ) {
      const docType = body.docType as LegalDocType;
      const row = await recordConsent({
        userId: ctx.user.id,
        docType,
        docVersion: LEGAL_DOC_VERSION[docType],
        ip,
        userAgent,
      });
      return NextResponse.json({
        recorded: [
          {
            docType: row.docType,
            docVersion: row.docVersion,
            acceptedAt: row.acceptedAt,
          },
        ],
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  });
}
