export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  spiceSelectable: boolean;
  spiceLevel: number;
  serves: string;
  badge: string;
  isAvailable: boolean;
  rating: number;
  ratingCount: number;
  category?: { id: string; name: string } | null;
}

export interface Cat {
  id: string;
  name: string;
  image?: string;
}

export interface Coupon {
  id: string;
  code: string;
  title?: string;
  description?: string;
  type: "PERCENT" | "FLAT" | "FREE_DELIVERY" | "FREE_ITEM";
  value: number;
  maxDiscount?: number;
  minOrder?: number;
}

export interface RecentItem {
  name: string;
  qty: number;
  menuItem?: {
    id: string;
    name: string;
    price: number;
    image?: string;
    spiceSelectable: boolean;
    spiceLevel: number;
    isAvailable: boolean;
  } | null;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  items: RecentItem[];
}

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
}
