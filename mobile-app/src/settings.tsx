import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@apollo/client";
import { APP_SETTINGS } from "./graphql";

/** Admin-managed runtime settings every screen can rely on. */
export interface AppSettings {
  brandName: string;
  tagline: string;
  storeOpenTime: string;
  storeCloseTime: string;
  storeOpenNow: boolean;
  minDeliveryCost: number;
  perKmCharge: number;
  freeDeliveryAbove: number;
  codEnabled: boolean;
  onlineEnabled: boolean;
  supportPhone: string;
  maintenance: { native: boolean };
}

export const DEFAULT_SETTINGS: AppSettings = {
  brandName: "Didi Bhaiya ki Biryani",
  tagline: "Har bite, yaad rahe!",
  storeOpenTime: "11:00",
  storeCloseTime: "23:00",
  storeOpenNow: true,
  minDeliveryCost: 39,
  perKmCharge: 0,
  freeDeliveryAbove: 399,
  codEnabled: true,
  onlineEnabled: true,
  supportPhone: "",
  maintenance: { native: false },
};

const Ctx = createContext<AppSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { data } = useQuery<{ settings: AppSettings }>(APP_SETTINGS, {
    pollInterval: 60000, // pick up admin changes (maintenance, hours) without restart
  });
  const value = data?.settings
    ? { ...DEFAULT_SETTINGS, ...data.settings }
    : DEFAULT_SETTINGS;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): AppSettings {
  return useContext(Ctx);
}

/** Delivery fee preview shown in cart/checkout (server recomputes at order time). */
export function previewDeliveryFee(subtotal: number, s: AppSettings): number {
  if (subtotal === 0) return 0;
  if (s.freeDeliveryAbove > 0 && subtotal >= s.freeDeliveryAbove) return 0;
  return Math.round(s.minDeliveryCost);
}
