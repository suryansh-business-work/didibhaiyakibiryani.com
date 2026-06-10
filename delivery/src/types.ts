export interface QueueOrder {
  id: string;
  orderNumber: string;
  total: number;
  deliveryFee: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  placedAt: string;
  notes?: string;
  user?: { name: string; phone?: string } | null;
  address: {
    line1: string;
    line2?: string;
    city: string;
    pincode: string;
    phone?: string;
    lat?: number;
    lng?: number;
  };
  items: { name: string; qty: number }[];
}

export interface DeliveredOrder {
  id: string;
  orderNumber: string;
  total: number;
  deliveryFee: number;
  paymentMethod: string;
  placedAt: string;
  address: { city: string; pincode: string };
}
