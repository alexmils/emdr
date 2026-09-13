/**
 * External clinical authorities cited on YMYL pages.
 * Never invent a named reviewer — cite these when `CLINICAL_ADVISOR` is empty.
 */
export type ClinicalAuthority = {
  id: string;
  name: string;
  /** Short label shown in lists (org / guideline name). */
  label: string;
  url: string;
};

export const CLINICAL_AUTHORITIES: readonly ClinicalAuthority[] = [
  {
    id: "emdria",
    name: "EMDR International Association",
    label: "EMDRIA",
    url: "https://www.emdria.org/",
  },
  {
    id: "apa",
    name: "APA Clinical Practice Guideline for the Treatment of PTSD in Adults",
    label: "APA PTSD guideline",
    url: "https://www.apa.org/ptsd-guideline",
  },
  {
    id: "nice",
    name: "NICE guideline NG116 — Post-traumatic stress disorder",
    label: "NICE NG116",
    url: "https://www.nice.org.uk/guidance/ng116",
  },
  {
    id: "who",
    name: "WHO — Post-traumatic stress disorder",
    label: "WHO",
    url: "https://www.who.int/news-room/fact-sheets/detail/post-traumatic-stress-disorder",
  },
  {
    id: "pubmed",
    name: "PubMed — EMDR and PTSD literature",
    label: "PubMed",
    url: "https://pubmed.ncbi.nlm.nih.gov/?term=EMDR+PTSD",
  },
] as const;

/** schema.org MedicalWebPage audience when no named clinician is listed. */
export const MEDICAL_PAGE_AUDIENCE = {
  "@type": "MedicalAudience",
  audienceType: "Patient",
} as const;

/** schema.org MedicalSpecialty for EMDR / trauma self-help pages. */
export const MEDICAL_PAGE_SPECIALTY = "https://schema.org/Psychiatric" as const;
