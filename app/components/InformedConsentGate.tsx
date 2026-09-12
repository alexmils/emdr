"use client";

import { useState } from "react";
import Link from "next/link";
import {
  INFORMED_CONSENT_KEYS,
  type InformedConsentKey,
} from "@/lib/consents-shared";
import { BRAND_SPOKEN } from "@/lib/brand";
import { LEGAL_DOC_VERSION } from "@/lib/legal-entity";

const LABELS: Record<InformedConsentKey, string> = {
  age18: "I am 18 years of age or older",
  notTherapist: `${BRAND_SPOKEN} is not a substitute for a licensed therapist or clinical care`,
  traumaMayIntensify:
    "Working with difficult memories may bring intense emotions, flooding, or upsetting material",
  notInCrisis:
    "I am not in an active crisis, do not have suicidal intent, and do not have a diagnosed dissociative disorder that makes self-guided work unsafe for me",
  noEmergencyDuty: `${BRAND_SPOKEN} does not provide emergency care — in a crisis I will contact 988 (US) or local emergency services`,
  specialCategoryData:
    "I consent to processing of my mental-health data (including session transcripts) to provide the service, as described in the Privacy Policy",
};

type Props = {
  onCompleted: () => void;
};

export function InformedConsentGate({ onCompleted }: Props) {
  const [checks, setChecks] = useState<
    Partial<Record<InformedConsentKey, boolean>>
  >({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const allChecked = INFORMED_CONSENT_KEYS.every((k) => checks[k] === true);

  const toggle = (key: InformedConsentKey) => {
    setChecks((c) => ({ ...c, [key]: !c[key] }));
    setError("");
  };

  const submit = async () => {
    if (!allChecked || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "informed_session", checks }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save consent");
        return;
      }
      onCompleted();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="informed-consent-gate">
      <h2 className="informed-consent-title font-sans">Before your first session</h2>
      <p className="informed-consent-lead">
        {BRAND_SPOKEN} is a self-help tool. It is not therapy, not a medical
        device, and does not diagnose. Confirm each statement to continue.
      </p>
      <ul className="informed-consent-list">
        {INFORMED_CONSENT_KEYS.map((key) => (
          <li key={key}>
            <label className="informed-consent-item">
              <input
                type="checkbox"
                checked={checks[key] === true}
                onChange={() => toggle(key)}
              />
              <span>{LABELS[key]}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="informed-consent-links">
        Read the{" "}
        <Link href="/terms" target="_blank" rel="noopener noreferrer">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </Link>
        . Consent version {LEGAL_DOC_VERSION.informed_session}.
      </p>
      {error ? <p className="informed-consent-error">{error}</p> : null}
      <button
        type="button"
        className="btn-primary"
        disabled={!allChecked || busy}
        onClick={() => void submit()}
      >
        {busy ? "Saving…" : "Record consent and continue"}
      </button>
    </div>
  );
}
