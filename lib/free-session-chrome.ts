/**
 * Free session chrome themes (header + canvas + controls dock).
 * Shared by Admin Platform picker and SessionWorkspace (mode === "free").
 * Colors stay on Nura pistachio tokens only.
 */

export const FREE_SESSION_CHROME_MIN = 1;
export const FREE_SESSION_CHROME_MAX = 10;
export const DEFAULT_FREE_SESSION_CHROME_ID = 1;

export type FreeSessionTheme = {
  page: string;
  canvas: string;
  headerBg: string;
  headerBorder: string;
  title: string;
  muted: string;
  dockBg: string;
  dockBorder: string;
  segBg: string;
  segBorder: string;
  segActiveBg: string;
  segActiveRing: string;
  label: string;
  icon: string;
};

export type FreeSessionChrome = {
  id: number;
  title: string;
  note: string;
  theme: FreeSessionTheme;
};

/** Soft mint — matches current product defaults. */
export const DEFAULT_FREE_SESSION_THEME: FreeSessionTheme = {
  page: "#edf9ed",
  canvas: "#dff5e0",
  headerBg: "#edf9ed",
  headerBorder: "#b8d4a8",
  title: "#2a3020",
  muted: "#948f4e",
  dockBg: "#f7fdf7",
  dockBorder: "#b8d4a8",
  segBg: "#dcebc4",
  segBorder: "#b8d4a8",
  segActiveBg: "#f7fdf7",
  segActiveRing: "color-mix(in srgb, #84b067 28%, #b8d4a8)",
  label: "#948f4e",
  icon: "#5e7048",
};

function theme(partial: Partial<FreeSessionTheme> = {}): FreeSessionTheme {
  return { ...DEFAULT_FREE_SESSION_THEME, ...partial };
}

export const FREE_SESSION_CHROMES: FreeSessionChrome[] = [
  {
    id: 1,
    title: "Soft mint",
    note: "Default product look",
    theme: theme(),
  },
  {
    id: 2,
    title: "Paper mint",
    note: "Brighter bars, soft canvas",
    theme: theme({
      page: "#f7fdf7",
      canvas: "#e8f6e8",
      headerBg: "#f7fdf7",
      headerBorder: "#c6d9b8",
      dockBg: "#ffffff",
      dockBorder: "#c6d9b8",
      segBg: "#edf9ed",
      segBorder: "#c6d9b8",
    }),
  },
  {
    id: 3,
    title: "Sage wash",
    note: "Sage-tinted header and dock",
    theme: theme({
      page: "#e4f0dc",
      canvas: "#d5e8cc",
      headerBg: "color-mix(in srgb, #84b067 14%, #edf9ed)",
      headerBorder: "color-mix(in srgb, #84b067 40%, #b8d4a8)",
      dockBg: "color-mix(in srgb, #84b067 10%, #f7fdf7)",
      dockBorder: "color-mix(in srgb, #84b067 35%, #b8d4a8)",
      segBg: "color-mix(in srgb, #84b067 18%, #dcebc4)",
      segActiveRing: "color-mix(in srgb, #84b067 45%, #b8d4a8)",
      label: "#6f9a58",
      icon: "#6f9a58",
    }),
  },
  {
    id: 4,
    title: "Olive quiet",
    note: "Muted olive chrome",
    theme: theme({
      page: "#e8eadc",
      canvas: "#dde0cc",
      headerBg: "#e8eadc",
      headerBorder: "#c4c6a8",
      muted: "#7a7848",
      dockBg: "#f4f5ec",
      dockBorder: "#c4c6a8",
      segBg: "#d6d8c0",
      segBorder: "#c4c6a8",
      segActiveRing: "color-mix(in srgb, #948f4e 40%, #c4c6a8)",
      label: "#7a7848",
      icon: "#5e7048",
    }),
  },
  {
    id: 5,
    title: "Canvas deep",
    note: "Deeper stage, light dock",
    theme: theme({
      page: "#dff5e0",
      canvas: "#c6e8c8",
      headerBg: "#e8f6e8",
      headerBorder: "#a8d0a8",
      dockBg: "#f7fdf7",
      dockBorder: "#a8d0a8",
      segBg: "#d0e8d0",
      segBorder: "#a8d0a8",
    }),
  },
  {
    id: 6,
    title: "Misty cream",
    note: "Very light cream-green",
    theme: theme({
      page: "#f4faf0",
      canvas: "#eaf5e4",
      headerBg: "#f4faf0",
      headerBorder: "#d0e0c0",
      dockBg: "#ffffff",
      dockBorder: "#d0e0c0",
      segBg: "#eaf5e4",
      segBorder: "#d0e0c0",
      muted: "#a0a060",
      label: "#a0a060",
    }),
  },
  {
    id: 7,
    title: "Grove bar",
    note: "Sidebar-echo olive bars",
    theme: theme({
      page: "#e6ebe0",
      canvas: "#d8e0d0",
      headerBg: "color-mix(in srgb, #3d4129 8%, #edf9ed)",
      headerBorder: "color-mix(in srgb, #3d4129 18%, #b8d4a8)",
      title: "#2a3020",
      dockBg: "color-mix(in srgb, #3d4129 5%, #f7fdf7)",
      dockBorder: "color-mix(in srgb, #3d4129 16%, #b8d4a8)",
      segBg: "color-mix(in srgb, #3d4129 10%, #dcebc4)",
      segBorder: "color-mix(in srgb, #3d4129 14%, #b8d4a8)",
      segActiveRing: "color-mix(in srgb, #84b067 35%, #3d4129)",
      label: "#5e7048",
      icon: "#3d4129",
    }),
  },
  {
    id: 8,
    title: "Pistachio focus",
    note: "Gold ring on active chips",
    theme: theme({
      page: "#edf9ed",
      canvas: "#e2f2d8",
      headerBg: "#f0f8e8",
      headerBorder: "#c6d67e",
      dockBg: "#f7fdf7",
      dockBorder: "#c6d67e",
      segBg: "#e8f0d0",
      segBorder: "#c6d67e",
      segActiveBg: "#ffffff",
      segActiveRing: "#c6d67e",
      label: "#848f4e",
      icon: "#84b067",
    }),
  },
  {
    id: 9,
    title: "Cool mist",
    note: "Cooler green-gray stage",
    theme: theme({
      page: "#e6f2ea",
      canvas: "#d4e8dc",
      headerBg: "#e6f2ea",
      headerBorder: "#a8c8b8",
      muted: "#6a8070",
      dockBg: "#f4faf6",
      dockBorder: "#a8c8b8",
      segBg: "#d4e4da",
      segBorder: "#a8c8b8",
      segActiveRing: "color-mix(in srgb, #84b067 30%, #a8c8b8)",
      label: "#6a8070",
      icon: "#5e7048",
    }),
  },
  {
    id: 10,
    title: "Warm grove",
    note: "Warmer olive canvas",
    theme: theme({
      page: "#f0f2e4",
      canvas: "#e4e8d0",
      headerBg: "#f0f2e4",
      headerBorder: "#c8ccb0",
      muted: "#8a8648",
      dockBg: "#f8f9f0",
      dockBorder: "#c8ccb0",
      segBg: "#e0e4c8",
      segBorder: "#c8ccb0",
      segActiveRing: "color-mix(in srgb, #948f4e 45%, #c8ccb0)",
      label: "#8a8648",
      icon: "#6f6a40",
    }),
  },
];

export function clampFreeSessionChromeId(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_FREE_SESSION_CHROME_ID;
  return Math.min(
    FREE_SESSION_CHROME_MAX,
    Math.max(FREE_SESSION_CHROME_MIN, Math.round(n))
  );
}

export function resolveFreeSessionChrome(id: unknown): FreeSessionChrome {
  const n = clampFreeSessionChromeId(id);
  return (
    FREE_SESSION_CHROMES.find((c) => c.id === n) ?? FREE_SESSION_CHROMES[0]!
  );
}

export function freeSessionChromeCssVars(
  themeColors: FreeSessionTheme
): Record<string, string> {
  return {
    "--fs-page": themeColors.page,
    "--fs-canvas": themeColors.canvas,
    "--fs-header-bg": themeColors.headerBg,
    "--fs-header-border": themeColors.headerBorder,
    "--fs-title": themeColors.title,
    "--fs-muted": themeColors.muted,
    "--fs-dock-bg": themeColors.dockBg,
    "--fs-dock-border": themeColors.dockBorder,
    "--fs-seg-bg": themeColors.segBg,
    "--fs-seg-border": themeColors.segBorder,
    "--fs-seg-active-bg": themeColors.segActiveBg,
    "--fs-seg-active-ring": themeColors.segActiveRing,
    "--fs-label": themeColors.label,
    "--fs-icon": themeColors.icon,
  };
}
