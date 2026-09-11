"use client";

import Link from "next/link";
import { appPath } from "@/lib/app-base";
import { resolveChargeHint } from "@/lib/billing-charge-hint";
import { useApp } from "./AppProvider";

/** Subtle top-right header text: days until trial charge or renew. */
export function BillingChargeHint() {
  const { entitlement } = useApp();
  const hint = resolveChargeHint({
    status: entitlement?.status,
    accessTier: entitlement?.accessTier,
    trialEndsAt: entitlement?.trialEndsAt,
    renewsAt: entitlement?.renewsAt,
  });

  if (!hint) return null;

  return (
    <Link
      href={appPath("/billing")}
      className="billing-charge-hint"
      title={
        hint.kind === "trial"
          ? "View billing — trial ends soon"
          : "View billing — next renewal"
      }
    >
      {hint.label}
    </Link>
  );
}
