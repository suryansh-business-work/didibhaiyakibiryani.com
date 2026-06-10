export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
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
