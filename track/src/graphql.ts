import { gql } from "@apollo/client";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrackOrderResult {
  trackOrder: {
    orderNumber: string;
    customerName: string;
    status: OrderStatus;
    placedAt: string;
    etaMinutes: number | null;
    total: number;
    deliveryFee: number | null;
    paymentMethod: string | null;
    statusHistory: { status: OrderStatus; at: string }[];
    items: { name: string; qty: number }[];
    address: {
      line1: string;
      line2: string | null;
      city: string | null;
      pincode: string | null;
      lat: number | null;
      lng: number | null;
    } | null;
    destination: LatLng | null;
    rider: (LatLng & { at: string | null }) | null;
  } | null;
}

export const TRACK_ORDER = gql`
  query TrackOrder($orderNumber: String!) {
    trackOrder(orderNumber: $orderNumber) {
      orderNumber
      customerName
      status
      placedAt
      etaMinutes
      total
      deliveryFee
      paymentMethod
      statusHistory {
        status
        at
      }
      items {
        name
        qty
      }
      address {
        line1
        line2
        city
        pincode
        lat
        lng
      }
      destination {
        lat
        lng
      }
      rider {
        lat
        lng
        at
      }
    }
  }
`;
