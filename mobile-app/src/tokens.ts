/**
 * Design tokens for Didi Bhaiya ki Biryani.
 *
 * Colours are split into:
 *  - `accent`  — brand colours that stay constant in light AND dark (gold,
 *    maroon, green, red). Safe to use at module scope (status colours etc.).
 *  - surface tokens (bg / card / text / border / muted …) that differ per
 *    scheme — consumed reactively via `useColors()` from `./theme`.
 *
 * Spacing / radius / typography scales make spacing and sizing consistent.
 */

export const accent = {
  gold: "#e4b65c",
  goldDeep: "#b9852f",
  maroon: "#4a1515",
  maroonSoft: "#6e2418",
  green: "#5fb45f",
  red: "#e0584b",
  blue: "#6aa3e0",
} as const;

export interface Colors {
  bg: string;
  bgSoft: string;
  card: string;
  cardSoft: string;
  border: string;
  borderStrong: string;
  text: string;
  dim: string;
  muted: string;
  faint: string;
  gold: string;
  goldDeep: string;
  maroon: string;
  maroonSoft: string;
  green: string;
  red: string;
  blue: string;
  onGold: string;
}

const darkColors: Colors = {
  bg: "#0b0705",
  bgSoft: "#110c08",
  card: "#17110c",
  cardSoft: "#1d150d",
  border: "rgba(232,200,140,0.14)",
  borderStrong: "rgba(232,200,140,0.26)",
  text: "#f5ece0",
  dim: "#cdbfb0",
  muted: "#8d8073",
  faint: "#6b6157",
  // Accents — readable on dark surfaces.
  gold: accent.gold,
  goldDeep: accent.goldDeep,
  maroon: accent.maroon,
  maroonSoft: accent.maroonSoft,
  green: accent.green,
  red: accent.red,
  blue: accent.blue,
  // Fixed text colour that sits on a gold button (same in both schemes).
  onGold: "#2a1a06",
};

const lightColors: Colors = {
  bg: "#fbf7f0",
  bgSoft: "#fff3e2",
  card: "#ffffff",
  cardSoft: "#f6efe3",
  border: "rgba(74,21,21,0.12)",
  borderStrong: "rgba(74,21,21,0.22)",
  text: "#2a1a06",
  dim: "#5c4a36",
  muted: "#8a7a66",
  faint: "#a99a84",
  // On light surfaces, gold-as-text needs more depth to stay readable; the
  // gold button keeps its dark text so a deeper gold still reads as a button.
  gold: "#a9760f",
  goldDeep: "#7d560f",
  maroon: accent.maroon,
  maroonSoft: accent.maroonSoft,
  green: "#3f9a3f",
  red: "#cf4438",
  blue: "#2f74c0",
  onGold: "#2a1a06",
};

export type Scheme = "light" | "dark";

export const palettes: Record<Scheme, Colors> = { dark: darkColors, light: lightColors };

/** Static dark palette — backward-compatible default for any non-reactive use. */
export const brandDark = darkColors;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
export const fontSize = { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 26 } as const;
export const fontWeight = { regular: "400", medium: "600", bold: "700", heavy: "800" } as const;
