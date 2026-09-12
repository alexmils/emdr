/**
 * Primary emergency dial codes by ISO 3166-1 alpha-2.
 * Prefer the national unified number (112 / 911 / 999 / 000 / 111).
 * Sources: ITU/EU 112, US State Dept “911 Abroad”, Microsoft Teams emergency reference.
 */

export type DialLink = {
  /** Digits only for tel:/sms: href */
  dial: string;
  /** Human-readable number */
  display: string;
};

export type CountryCrisisResources = {
  countryCode: string | null;
  countryName: string | null;
  emergency: DialLink | null;
  /** Mental-health / suicide crisis line when we have a verified national number */
  crisis: (DialLink & { smsDial?: string; note: string }) | null;
  findHelplineUrl: string;
};

/** Primary police/ambulance/fire unified number where one exists. */
const PRIMARY_EMERGENCY: Record<string, string> = {
  AD: "112",
  AE: "999",
  AG: "911",
  AI: "911",
  AL: "112",
  AM: "911",
  AO: "112",
  AR: "911",
  AS: "911",
  AT: "112",
  AU: "000",
  AX: "112",
  AZ: "112",
  BA: "112",
  BB: "911",
  BD: "999",
  BE: "112",
  BG: "112",
  BH: "999",
  BM: "911",
  BO: "110",
  BR: "190",
  BS: "911",
  BT: "112",
  BW: "999",
  BY: "112",
  BZ: "911",
  CA: "911",
  CH: "112",
  CL: "133",
  CN: "110",
  CO: "123",
  CR: "911",
  CY: "112",
  CZ: "112",
  DE: "112",
  DK: "112",
  DO: "911",
  DZ: "112",
  EC: "911",
  EE: "112",
  EG: "122",
  ES: "112",
  ET: "911",
  FI: "112",
  FJ: "911",
  FO: "112",
  FR: "112",
  GB: "999",
  GE: "112",
  GG: "999",
  GH: "112",
  GI: "999",
  GL: "112",
  GR: "112",
  GT: "110",
  GU: "911",
  HK: "999",
  HN: "911",
  HR: "112",
  HU: "112",
  ID: "112",
  IE: "112",
  IL: "100",
  IM: "999",
  IN: "112",
  IQ: "122",
  IS: "112",
  IT: "112",
  JE: "999",
  JM: "119",
  JO: "911",
  JP: "110",
  KE: "999",
  KG: "112",
  KH: "117",
  KR: "112",
  KW: "112",
  KY: "911",
  KZ: "112",
  LB: "112",
  LI: "112",
  LK: "119",
  LT: "112",
  LU: "112",
  LV: "112",
  MA: "19",
  MC: "112",
  MD: "112",
  ME: "112",
  MK: "112",
  MT: "112",
  MX: "911",
  MY: "999",
  NG: "112",
  NL: "112",
  NO: "112",
  NP: "100",
  NZ: "111",
  OM: "999",
  PA: "911",
  PE: "105",
  PH: "911",
  PK: "15",
  PL: "112",
  PR: "911",
  PT: "112",
  PY: "911",
  QA: "999",
  RO: "112",
  RS: "112",
  RU: "112",
  SA: "911",
  SE: "112",
  SG: "999",
  SI: "112",
  SK: "112",
  SM: "112",
  SV: "911",
  TH: "191",
  TR: "112",
  TT: "999",
  TW: "110",
  TZ: "112",
  UA: "112",
  UG: "999",
  US: "911",
  UY: "911",
  UZ: "112",
  VE: "911",
  VI: "911",
  VN: "113",
  XK: "112",
  ZA: "10111",
  ZM: "999",
};

/**
 * Verified national / widely published crisis or suicide prevention lines.
 * Prefer freephone / 3-digit where available. Keep the set conservative.
 */
const CRISIS_LINES: Record<
  string,
  { dial: string; display: string; note: string; smsDial?: string }
> = {
  US: {
    dial: "988",
    display: "988",
    note: "Suicide & Crisis Lifeline",
    smsDial: "988",
  },
  CA: {
    dial: "988",
    display: "988",
    note: "Suicide Crisis Helpline",
    smsDial: "988",
  },
  PR: {
    dial: "988",
    display: "988",
    note: "Suicide & Crisis Lifeline",
    smsDial: "988",
  },
  VI: {
    dial: "988",
    display: "988",
    note: "Suicide & Crisis Lifeline",
    smsDial: "988",
  },
  GU: {
    dial: "988",
    display: "988",
    note: "Suicide & Crisis Lifeline",
    smsDial: "988",
  },
  GB: {
    dial: "116123",
    display: "116 123",
    note: "Samaritans",
  },
  IE: {
    dial: "116123",
    display: "116 123",
    note: "Samaritans",
  },
  AU: {
    dial: "131114",
    display: "13 11 14",
    note: "Lifeline",
  },
  NZ: {
    dial: "1737",
    display: "1737",
    note: "Need to talk?",
  },
  FR: {
    dial: "3114",
    display: "3114",
    note: "National suicide prevention",
  },
  NL: {
    dial: "113",
    display: "113",
    note: "113 Suicide Prevention",
  },
  BE: {
    dial: "1813",
    display: "1813",
    note: "Suicide prevention",
  },
  RS: {
    dial: "0800309309",
    display: "0800 309 309",
    note: "National suicide prevention SOS",
  },
  HR: {
    dial: "014833888",
    display: "01 4833 888",
    note: "Plavi telefon",
  },
  DE: {
    dial: "08001110111",
    display: "0800 111 0 111",
    note: "Telefonseelsorge",
  },
  AT: {
    dial: "142",
    display: "142",
    note: "TelefonSeelsorge",
  },
  CH: {
    dial: "143",
    display: "143",
    note: "Die Dargebotene Hand",
  },
  SE: {
    dial: "90101",
    display: "90101",
    note: "Mind Självmordslinjen",
  },
  NO: {
    dial: "116123",
    display: "116 123",
    note: "Mental health helpline",
  },
  DK: {
    dial: "70201201",
    display: "70 201 201",
    note: "Livslinien",
  },
  FI: {
    dial: "0925250111",
    display: "09 2525 0111",
    note: "Crisis helpline (MIELI)",
  },
  PL: {
    dial: "116123",
    display: "116 123",
    note: "Emotional support",
  },
  ES: {
    dial: "024",
    display: "024",
    note: "Suicide prevention",
  },
  IT: {
    dial: "800860022",
    display: "800 86 00 22",
    note: "Telefono Amico",
  },
  PT: {
    dial: "800200204",
    display: "800 200 204",
    note: "SOS Voz Amiga",
  },
  IN: {
    dial: "9152987821",
    display: "91529 87821",
    note: "AASRA",
  },
  JP: {
    dial: "0570783556",
    display: "0570-783-556",
    note: "TELL Japan",
  },
  KR: {
    dial: "1393",
    display: "1393",
    note: "Suicide prevention",
  },
  SG: {
    dial: "1767",
    display: "1767",
    note: "Samaritans of Singapore",
  },
  ZA: {
    dial: "0800567567",
    display: "0800 567 567",
    note: "SADAG",
  },
  BR: {
    dial: "188",
    display: "188",
    note: "CVV",
  },
  MX: {
    dial: "8009112000",
    display: "800 911 2000",
    note: "SAPTEL",
  },
  AR: {
    dial: "135",
    display: "135",
    note: "Centro de Asistencia al Suicida",
  },
};

export const FIND_A_HELPLINE_URL =
  "https://www.iasp.info/suicidalthoughts/";

/**
 * Safe panel default before geo resolves: dialable US/CA crisis line + IASP.
 * Does not claim the visitor's country; emergency stays generic until localized.
 */
export function safeDefaultCrisisResources(): CountryCrisisResources {
  return {
    countryCode: null,
    countryName: null,
    emergency: null,
    crisis: {
      dial: "988",
      display: "988",
      note: "Suicide & Crisis Lifeline (US / Canada)",
      smsDial: "988",
    },
    findHelplineUrl: FIND_A_HELPLINE_URL,
  };
}

export function countryDisplayName(
  countryCode: string | null,
  locale = "en"
): string | null {
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) return null;
  try {
    const name = new Intl.DisplayNames([locale], { type: "region" }).of(
      countryCode
    );
    return name ?? countryCode;
  } catch {
    return countryCode;
  }
}

export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (code === "XX" || code === "T1" || code === "A1" || code === "A2") {
    return null;
  }
  if (!/^[A-Z]{2}$/.test(code)) return null;
  return code;
}

export function resourcesForCountry(
  countryCodeRaw: string | null,
  locale = "en"
): CountryCrisisResources {
  const countryCode = normalizeCountryCode(countryCodeRaw);
  const countryName = countryDisplayName(countryCode, locale);
  const emergencyDial = countryCode
    ? PRIMARY_EMERGENCY[countryCode] ?? null
    : null;
  const crisis = countryCode ? CRISIS_LINES[countryCode] ?? null : null;

  return {
    countryCode,
    countryName,
    emergency: emergencyDial
      ? { dial: emergencyDial, display: formatDialDisplay(emergencyDial) }
      : null,
    crisis: crisis
      ? {
          dial: crisis.dial,
          display: crisis.display,
          note: crisis.note,
          smsDial: crisis.smsDial,
        }
      : null,
    findHelplineUrl: FIND_A_HELPLINE_URL,
  };
}

/** Prefer spaced grouping for long freephone numbers when no display override. */
function formatDialDisplay(dial: string): string {
  if (dial.length <= 3) return dial;
  if (dial.startsWith("0800") && dial.length === 10) {
    return `${dial.slice(0, 4)} ${dial.slice(4, 7)} ${dial.slice(7)}`;
  }
  if (dial.startsWith("116") && dial.length === 6) {
    return `${dial.slice(0, 3)} ${dial.slice(3)}`;
  }
  return dial;
}
