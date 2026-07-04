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
  receiptUrl: string;
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
  receiptUrl: string;
  address: { city: string; pincode: string };
}

export interface RiderUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
}
