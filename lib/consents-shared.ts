import { LEGAL_DOC_VERSION, type LegalDocType } from "@/lib/legal-entity";

/** Doc types required before starting Guided/Free processing. */
export const SESSION_REQUIRED_DOC_TYPES: LegalDocType[] = [
  "age_18",
  "informed_session",
];

export function requiredConsentVersions(): Record<
  "age_18" | "informed_session",
  string
> {
  return {
    age_18: LEGAL_DOC_VERSION.age_18,
    informed_session: LEGAL_DOC_VERSION.informed_session,
  };
}

/** Informed-session gate: six attestations from safety-legal-hardening.md. */
export const INFORMED_CONSENT_KEYS = [
  "age18",
  "notTherapist",
  "traumaMayIntensify",
  "notInCrisis",
  "noEmergencyDuty",
  "specialCategoryData",
] as const;

export type InformedConsentKey = (typeof INFORMED_CONSENT_KEYS)[number];

export function allInformedKeysAccepted(
  checks: Partial<Record<InformedConsentKey, boolean>>
): boolean {
  return INFORMED_CONSENT_KEYS.every((k) => checks[k] === true);
}
