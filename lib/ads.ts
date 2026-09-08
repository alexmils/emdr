/** Free-session interstitial ad frequency (Elementor-style timing). */

export type AdProvider = "placeholder" | "adsense" | "gam";

export type AdFrequencyMode =
  | "per_session"
  | "every_minutes"
  | "every_n_sets"
  | "per_set";

export type PlatformAdsSettings = {
  enabled: boolean;
  provider: AdProvider;
  adsenseClient: string;
  adsenseSlot: string;
  frequencyMode: AdFrequencyMode;
  everyMinutes: number;
  everyNSets: number;
  minWatchSeconds: number;
};

export const DEFAULT_PLATFORM_ADS: PlatformAdsSettings = {
  enabled: false,
  provider: "placeholder",
  adsenseClient: "",
  adsenseSlot: "",
  frequencyMode: "per_session",
  everyMinutes: 5,
  everyNSets: 3,
  minWatchSeconds: 5,
};

/** Public payload for the client — only populated when ads are active for this user. */
export type PublicAdsConfig =
  | { adsActive: false }
  | {
      adsActive: true;
      provider: AdProvider;
      adsenseClient: string;
      adsenseSlot: string;
      frequencyMode: AdFrequencyMode;
      everyMinutes: number;
      everyNSets: number;
      minWatchSeconds: number;
    };

/** Result of the free-session ad gate (BLS starts only on "continued"). */
export type AdGateResult = "continued" | "upgraded" | "skipped";

/** Whether SessionWorkspace should start BLS after the ad gate settles. */
export function shouldBeginBlsAfterAd(result: AdGateResult): boolean {
  return result === "continued" || result === "skipped";
}

export type AdDecisionState = {
  sessionShownCount: number;
  lastShownAt: number | null;
  setsSinceLastAd: number;
};

export type AdDecisionConfig = {
  adsActive: boolean;
  frequencyMode: AdFrequencyMode;
  everyMinutes: number;
  everyNSets: number;
};

export function resolveAdDecision(
  config: AdDecisionConfig,
  state: AdDecisionState,
  now: number = Date.now()
): { show: boolean } {
  if (!config.adsActive) return { show: false };

  switch (config.frequencyMode) {
    case "per_session":
      return { show: state.sessionShownCount === 0 };
    case "every_minutes": {
      const mins = Math.max(1, config.everyMinutes);
      if (state.lastShownAt == null) return { show: true };
      return {
        show: now - state.lastShownAt >= mins * 60_000,
      };
    }
    case "every_n_sets": {
      const n = Math.max(1, config.everyNSets);
      return { show: state.setsSinceLastAd >= n };
    }
    case "per_set":
      return { show: true };
    default:
      return { show: false };
  }
}

export function normalizeAdsSettings(raw: unknown): PlatformAdsSettings {
  const r =
    raw && typeof raw === "object"
      ? (raw as Partial<PlatformAdsSettings>)
      : {};
  const provider: AdProvider =
    r.provider === "adsense" || r.provider === "gam" || r.provider === "placeholder"
      ? r.provider
      : DEFAULT_PLATFORM_ADS.provider;
  const frequencyMode: AdFrequencyMode =
    r.frequencyMode === "every_minutes" ||
    r.frequencyMode === "every_n_sets" ||
    r.frequencyMode === "per_set" ||
    r.frequencyMode === "per_session"
      ? r.frequencyMode
      : DEFAULT_PLATFORM_ADS.frequencyMode;

  const everyMinutes =
    typeof r.everyMinutes === "number" && Number.isFinite(r.everyMinutes)
      ? Math.max(1, Math.min(120, Math.round(r.everyMinutes)))
      : DEFAULT_PLATFORM_ADS.everyMinutes;
  const everyNSets =
    typeof r.everyNSets === "number" && Number.isFinite(r.everyNSets)
      ? Math.max(1, Math.min(50, Math.round(r.everyNSets)))
      : DEFAULT_PLATFORM_ADS.everyNSets;
  const minWatchSeconds =
    typeof r.minWatchSeconds === "number" && Number.isFinite(r.minWatchSeconds)
      ? Math.max(0, Math.min(60, Math.round(r.minWatchSeconds)))
      : DEFAULT_PLATFORM_ADS.minWatchSeconds;

  return {
    enabled: r.enabled === true,
    provider,
    adsenseClient:
      typeof r.adsenseClient === "string" ? r.adsenseClient.trim().slice(0, 80) : "",
    adsenseSlot:
      typeof r.adsenseSlot === "string" ? r.adsenseSlot.trim().slice(0, 80) : "",
    frequencyMode,
    everyMinutes,
    everyNSets,
    minWatchSeconds,
  };
}

/** Build the client-facing ads payload. Paying users get adsActive:false only. */
export function publicAdsConfig(
  ads: PlatformAdsSettings,
  isTrialLimited: boolean
): PublicAdsConfig {
  const adsActive = ads.enabled && isTrialLimited;
  if (!adsActive) return { adsActive: false };
  return {
    adsActive: true,
    provider: ads.provider,
    adsenseClient: ads.adsenseClient,
    adsenseSlot: ads.adsenseSlot,
    frequencyMode: ads.frequencyMode,
    everyMinutes: ads.everyMinutes,
    everyNSets: ads.everyNSets,
    minWatchSeconds: ads.minWatchSeconds,
  };
}
