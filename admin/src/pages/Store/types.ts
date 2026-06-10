export interface MaintenanceFlags {
  website: boolean;
  server: boolean;
  admin: boolean;
  native: boolean;
  delivery: boolean;
}

export interface StoreSettingsData {
  storeOpenTime: string;
  storeCloseTime: string;
  storeTimezone: string;
  storeOpenNow: boolean;
  maintenance: MaintenanceFlags;
  updatedAt?: string;
}

export interface StoreForm {
  storeOpenTime: string;
  storeCloseTime: string;
  storeTimezone: string;
  maintenance: MaintenanceFlags;
}

export const BLANK_STORE: StoreForm = {
  storeOpenTime: "11:00",
  storeCloseTime: "23:00",
  storeTimezone: "Asia/Kolkata",
  maintenance: { website: false, server: false, admin: false, native: false, delivery: false },
};

export function settingsToStoreForm(s: Partial<StoreSettingsData>): StoreForm {
  return {
    storeOpenTime: s.storeOpenTime ?? BLANK_STORE.storeOpenTime,
    storeCloseTime: s.storeCloseTime ?? BLANK_STORE.storeCloseTime,
    storeTimezone: s.storeTimezone ?? BLANK_STORE.storeTimezone,
    maintenance: { ...BLANK_STORE.maintenance, ...(s.maintenance ?? {}) },
  };
}

interface MaintenanceAppDef {
  key: keyof MaintenanceFlags;
  label: string;
  hint: string;
}

export const MAINTENANCE_APPS: MaintenanceAppDef[] = [
  { key: "website", label: "Website", hint: "didibhaiyakibiryani.com" },
  { key: "server", label: "Server (ordering API)", hint: "server.didibhaiyakibiryani.com — blocks new orders" },
  { key: "admin", label: "Admin panel", hint: "admin.didibhaiyakibiryani.com — shows a banner only" },
  { key: "native", label: "Customer app", hint: "native.didibhaiyakibiryani.com" },
  { key: "delivery", label: "Delivery (rider) app", hint: "delivery.didibhaiyakibiryani.com" },
];
