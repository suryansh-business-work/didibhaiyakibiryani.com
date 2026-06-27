import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { palettes, brandDark, accent, type Colors, type Scheme } from "./tokens";

export type ThemeMode = "system" | "light" | "dark";
const STORE_KEY = "ddb_theme";

interface ThemeCtx {
  mode: ThemeMode;
  scheme: Scheme;
  colors: Colors;
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

/** Holds the active colour scheme: follows the OS by default, or a saved
 *  light/dark choice. Persisted so it survives restarts. */
export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then((raw) => {
      if (raw === "light" || raw === "dark" || raw === "system") {
        setModeState(raw);
      }
    });
  }, []);

  function setMode(m: ThemeMode) {
    setModeState(m);
    AsyncStorage.setItem(STORE_KEY, m).catch(() => {});
  }

  const scheme: Scheme = mode === "system" ? (system === "light" ? "light" : "dark") : mode;
  const value = useMemo<ThemeCtx>(() => ({ mode, scheme, colors: palettes[scheme], setMode }), [mode, scheme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Full theme controls (mode, resolved scheme, palette, setter). */
export function useThemeMode(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (ctx) {
    return ctx;
  }
  // Fallback when no provider is mounted (e.g. isolated unit tests).
  return { mode: "dark", scheme: "dark", colors: brandDark, setMode: () => {} };
}

/** The active colour palette — the everyday hook for screens & components. */
export function useColors(): Colors {
  return useThemeMode().colors;
}

/** Static dark palette. For module-scope / non-reactive use only — prefer
 *  `useColors()` inside components so light mode applies. */
export const brand = brandDark;

export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// Status colours are brand accents that read on both light & dark surfaces.
export const STATUS_META: Record<string, { label: string; color: string }> = {
  PLACED: { label: "Order placed", color: accent.gold },
  CONFIRMED: { label: "Confirmed", color: accent.blue },
  PREPARING: { label: "Preparing your biryani", color: accent.blue },
  OUT_FOR_DELIVERY: { label: "Out for delivery", color: accent.gold },
  DELIVERED: { label: "Delivered", color: accent.green },
  CANCELLED: { label: "Cancelled", color: accent.red },
};

export const STATUS_FLOW = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

export type { Colors } from "./tokens";
