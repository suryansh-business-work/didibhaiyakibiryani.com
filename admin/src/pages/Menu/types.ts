export interface Cat {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  spiceLevel: number;
  serves: string;
  badge: string;
  tags: string[];
  isAvailable: boolean;
  category?: { id: string; name: string } | null;
}

export interface MenuForm {
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  spiceLevel: number;
  serves: string;
  badge: string;
  tags: string;
  isAvailable: boolean;
}

/** Empty-form defaults (reusable configuration, not business data). */
export const BLANK_FORM: MenuForm = {
  name: "",
  description: "",
  price: 0,
  image: "",
  categoryId: "",
  spiceLevel: 0,
  serves: "Serves 1",
  badge: "NONE",
  tags: "",
  isAvailable: true,
};

export const BADGE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "NONE", label: "None" },
  { value: "BESTSELLER", label: "Bestseller" },
  { value: "NEW", label: "New" },
];
