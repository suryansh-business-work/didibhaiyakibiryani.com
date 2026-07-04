export interface FinanceSettingsData {
  minDeliveryCost: number;
  perKmCharge: number;
  freeDeliveryAbove: number;
  storeLat: number;
  storeLng: number;
  gstLegalName: string;
  gstNumber: string;
  fssaiLicense: string;
  codEnabled: boolean;
  onlineEnabled: boolean;
  updatedAt?: string;
}

export type FinanceForm = Omit<FinanceSettingsData, "updatedAt">;

export const BLANK_FINANCE: FinanceForm = {
  minDeliveryCost: 39,
  perKmCharge: 0,
  freeDeliveryAbove: 399,
  storeLat: 0,
  storeLng: 0,
  gstLegalName: "",
  gstNumber: "",
  fssaiLicense: "",
  codEnabled: true,
  onlineEnabled: true,
};

export function settingsToFinanceForm(s: Partial<FinanceSettingsData>): FinanceForm {
  return {
    minDeliveryCost: s.minDeliveryCost ?? BLANK_FINANCE.minDeliveryCost,
    perKmCharge: s.perKmCharge ?? BLANK_FINANCE.perKmCharge,
    freeDeliveryAbove: s.freeDeliveryAbove ?? BLANK_FINANCE.freeDeliveryAbove,
    storeLat: s.storeLat ?? 0,
    storeLng: s.storeLng ?? 0,
    gstLegalName: s.gstLegalName ?? "",
    gstNumber: s.gstNumber ?? "",
    fssaiLicense: s.fssaiLicense ?? "",
    codEnabled: s.codEnabled ?? true,
    onlineEnabled: s.onlineEnabled ?? true,
  };
}

interface NumberFieldDef {
  key: "minDeliveryCost" | "perKmCharge" | "freeDeliveryAbove" | "storeLat" | "storeLng";
  label: string;
  hint?: string;
  step?: string;
}

export const DELIVERY_COST_FIELDS: NumberFieldDef[] = [
  { key: "minDeliveryCost", label: "Min delivery cost (₹)", hint: "Base fee on every order" },
  { key: "perKmCharge", label: "Per-km charge (₹)", hint: "Added per km from the store" },
  { key: "freeDeliveryAbove", label: "Free delivery above (₹)", hint: "0 disables free delivery" },
  { key: "storeLat", label: "Store latitude", hint: "For distance-based pricing", step: "0.000001" },
  { key: "storeLng", label: "Store longitude", hint: "For distance-based pricing", step: "0.000001" },
];

