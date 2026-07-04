import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($emailOrPhone: String!, $password: String!) {
    login(emailOrPhone: $emailOrPhone, password: $password) {
      token
      user { id name email role }
    }
  }
`;

export const ME = gql`
  query Me {
    me { id name email phone avatarUrl role }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $phone: String, $avatarUrl: String) {
    updateProfile(name: $name, phone: $phone, avatarUrl: $avatarUrl) {
      id
      name
      phone
      avatarUrl
    }
  }
`;

export const UPLOAD_AVATAR = gql`
  mutation UploadAvatar($file: String!, $fileName: String!) {
    uploadAvatarImage(file: $file, fileName: $fileName) {
      url
    }
  }
`;

export const SETTINGS_LITE = gql`
  query SettingsLite {
    settings {
      brandName
      logoUrl
      tagline
      fontFamily
      supportPhone
      supportEmail
      maintenance { delivery }
    }
  }
`;

const ORDER_FIELDS = `
  id
  orderNumber
  total
  deliveryFee
  status
  paymentMethod
  paymentStatus
  placedAt
  notes
  receiptUrl
  user { name phone }
  address { line1 line2 city pincode phone lat lng }
  items { name qty }
`;

export const DELIVERY_QUEUE = gql`
  query DeliveryQueue {
    deliveryQueue {
      ${ORDER_FIELDS}
    }
  }
`;

export const MY_DELIVERIES = gql`
  query MyDeliveries($limit: Int) {
    myDeliveries(limit: $limit) {
      id
      orderNumber
      total
      deliveryFee
      paymentMethod
      placedAt
      receiptUrl
      address { city pincode }
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!, $note: String) {
    updateOrderStatus(id: $id, status: $status, note: $note) {
      id
      status
    }
  }
`;

export const UPDATE_RIDER_LOCATION = gql`
  mutation UpdateRiderLocation($lat: Float!, $lng: Float!) {
    updateRiderLocation(lat: $lat, lng: $lng)
  }
`;
