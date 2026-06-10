import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($emailOrPhone: String!, $password: String!) {
    login(emailOrPhone: $emailOrPhone, password: $password) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!, $note: String) {
    updateOrderStatus(id: $id, status: $status, note: $note) {
      id
      status
      statusHistory {
        status
        at
        note
      }
    }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CategoryInput!) {
    createCategory(input: $input) {
      id
    }
  }
`;
export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: CategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
    }
  }
`;
export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

export const CREATE_ITEM = gql`
  mutation CreateMenuItem($input: MenuItemInput!) {
    createMenuItem(input: $input) {
      id
    }
  }
`;
export const UPDATE_ITEM = gql`
  mutation UpdateMenuItem($id: ID!, $input: MenuItemInput!) {
    updateMenuItem(id: $id, input: $input) {
      id
    }
  }
`;
export const DELETE_ITEM = gql`
  mutation DeleteMenuItem($id: ID!) {
    deleteMenuItem(id: $id)
  }
`;
export const TOGGLE_ITEM = gql`
  mutation ToggleItem($id: ID!) {
    toggleItemAvailability(id: $id) {
      id
      isAvailable
    }
  }
`;

export const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CouponInput!) {
    createCoupon(input: $input) {
      id
    }
  }
`;
export const UPDATE_COUPON = gql`
  mutation UpdateCoupon($id: ID!, $input: CouponInput!) {
    updateCoupon(id: $id, input: $input) {
      id
    }
  }
`;
export const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: ID!) {
    deleteCoupon(id: $id)
  }
`;

export const UPDATE_SETTINGS = gql`
  mutation UpdateSettings($input: SettingsInput!) {
    updateSettings(input: $input) {
      brandName
      tagline
      logoUrl
      primaryColor
      accentColor
      companyName
      companyAddress
      companyPhone
      companyEmail
      supportPhone
      supportEmail
      fssaiLicense
      instagramUrl
      facebookUrl
      youtubeUrl
      updatedAt
    }
  }
`;

export const REFUND_PAYMENT = gql`
  mutation RefundPayment($paymentId: ID!, $amount: Float, $reason: String) {
    refundPayment(paymentId: $paymentId, amount: $amount, reason: $reason) {
      id
      status
      refunds {
        providerRefundId
        amount
        reason
        at
      }
    }
  }
`;
