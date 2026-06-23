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
}

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
}
