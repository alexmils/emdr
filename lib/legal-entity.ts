import { BRAND_DOMAIN, BRAND_SPOKEN } from "@/lib/brand";

/**
 * Operator / counsel fields for Terms, Privacy, and JSON-LD legalName.
 */
export type LegalEntity = {
  /** Registered company or sole-trader name. */
  legalName: string | null;
  /** Trade / product name when different from the registered entity. */
  tradingAs: string | null;
  /** Street / city / postal. */
  address: string | null;
  /** Country of establishment. */
  country: string | null;
  /** Company / trade register number. */
  registryId: string | null;
  /** Governing law label, e.g. "Wyoming, United States". */
  governingLaw: string | null;
  /** Preferred dispute forum (courts or arbitration seat). */
  jurisdiction: string | null;
};

/** Wyoming LLC that operates the Nura web app (nurahelp.com). */
export const LEGAL_ENTITY: LegalEntity = {
  legalName: "Receptly LLC",
  tradingAs: BRAND_SPOKEN,
  address: "30 N Gould St, Sheridan, WY 82801",
  country: "United States",
  registryId: null,
  governingLaw: "Wyoming, United States",
  jurisdiction: "the state and federal courts located in Wyoming, United States",
};

/** Hosting region note for Privacy (Coolify VPS — see docs/production.md). */
export const DATA_HOSTING_REGION =
  "Application and primary database run on a VPS at approximately EU (Hetzner-class / Coolify on 217.76.58.141). Exact datacenter metro may change; contact support for the current region.";

export type LegalDocType =
  | "terms"
  | "privacy"
  | "informed_session"
  | "age_18";

/** Bump when Terms / Privacy / informed-consent copy materially changes. */
export const LEGAL_DOC_VERSION = {
  terms: "terms@2026-09-12c",
  privacy: "privacy@2026-09-12d",
  informed_session: "informed_session@2026-09-12",
  age_18: "age_18@2026-09-12",
} as const satisfies Record<LegalDocType, string>;

export type ClinicalAdvisor = {
  name: string | null;
  credentials: string | null;
  /** ISO date of last review of intake / safety copy. */
  lastReviewedAt: string | null;
};

/** Set when a named EMDR-certified advisor has agreed to be listed. */
export const CLINICAL_ADVISOR: ClinicalAdvisor = {
  name: null,
  credentials: null,
  lastReviewedAt: null,
};

export function hasClinicalAdvisorConfigured(): boolean {
  return Boolean(CLINICAL_ADVISOR.name?.trim());
}

export function legalEntityDisplayName(): string {
  return LEGAL_ENTITY.legalName?.trim() || BRAND_SPOKEN;
}

export function formatLegalEntityBlock(): string {
  const lines: string[] = [];
  lines.push(`Operator: ${legalEntityDisplayName()}`);
  if (LEGAL_ENTITY.tradingAs?.trim()) {
    lines.push(`Trading as: ${LEGAL_ENTITY.tradingAs.trim()}`);
  }
  if (LEGAL_ENTITY.address?.trim()) lines.push(LEGAL_ENTITY.address.trim());
  if (LEGAL_ENTITY.country?.trim()) lines.push(LEGAL_ENTITY.country.trim());
  if (LEGAL_ENTITY.registryId?.trim()) {
    lines.push(`Registry: ${LEGAL_ENTITY.registryId.trim()}`);
  }
  if (!LEGAL_ENTITY.legalName) {
    lines.push(
      `(Legal entity details pending — contact hi@contact.${BRAND_DOMAIN} or support for the current operator identity.)`
    );
  }
  return lines.join("\n");
}

export function pendingCounselNotice(spoken = BRAND_SPOKEN): string {
  return `This page is a product draft for ${spoken}, operated by ${legalEntityDisplayName()}. It is not a substitute for attorney-reviewed terms. Do not treat it as final legal advice.`;
}
