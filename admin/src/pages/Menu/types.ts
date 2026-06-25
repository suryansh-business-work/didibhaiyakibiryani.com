import type { MenuForm } from "../../form";

export type { MenuForm };

export interface Cat {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  makingCost?: number;
  image?: string;
  spiceSelectable: boolean;
  spiceLevel: number;
  serves: string;
  badge: string;
  tags: string[];
  isAvailable: boolean;
  category?: { id: string; name: string } | null;
}

/** Empty-form defaults (reusable configuration, not business data). */
export const BLANK_FORM: MenuForm = {
  name: "",
  description: "",
  price: 0,
  makingCost: 0,
  image: "",
  categoryId: "",
  spiceSelectable: true,
  spiceLevel: 0,
  serves: "1",
  badge: "NONE",
  tags: "",
  isAvailable: true,
};

export const BADGE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "NONE", label: "None" },
  { value: "BESTSELLER", label: "Bestseller" },
  { value: "NEW", label: "New" },
];

/** Default spice level options (index = stored level). */
export const SPICE_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: "Mild" },
  { value: 1, label: "Medium" },
  { value: 2, label: "Spicy" },
  { value: 3, label: "Fiery" },
];

/** "Serves N" dropdown — 1 to 10 people. */
export const SERVES_OPTIONS: ReadonlyArray<{ value: string; label: string }> = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: i === 0 ? "1 person" : `${i + 1} people`,
}));
