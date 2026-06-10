import { gql } from "@apollo/client";

export const ME = gql`
  query Me {
    me {
      id
      name
      email
      phone
      addresses {
        id
        label
        line1
        line2
        city
        pincode
        isDefault
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user { id name email }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($emailOrPhone: String!, $password: String!) {
    login(emailOrPhone: $emailOrPhone, password: $password) {
      token
      user { id name email }
    }
  }
`;

export const ADD_ADDRESS = gql`
  mutation AddAddress($input: AddressInput!) {
    addAddress(input: $input) {
      id
      addresses { id label line1 line2 city pincode isDefault }
    }
  }
`;

export const HOME_DATA = gql`
  query HomeData {
    categories(activeOnly: true) {
      id
      name
    }
    menuItems(availableOnly: true) {
      id
      name
      description
      price
      spiceLevel
      serves
      badge
      isVeg
      rating
      ratingCount
      category { id name }
    }
  }
`;

export const MENU_ITEM = gql`
  query MenuItem($id: ID!) {
    menuItem(id: $id) {
      id
      name
      description
      price
      spiceLevel
      serves
      badge
      isVeg
      rating
      ratingCount
      category { id name }
    }
  }
`;

export const OFFERS = gql`
  query Offers {
    coupons(activeOnly: true) {
      id
      code
      title
      description
      type
      value
      maxDiscount
      minOrder
      appOnly
      firstOrderOnly
    }
  }
`;

export const VALIDATE_COUPON = gql`
  query ValidateCoupon($code: String!, $subtotal: Float!) {
    validateCoupon(code: $code, subtotal: $subtotal) {
      valid
      message
      discount
      coupon { code type }
    }
  }
`;

export const PLACE_ORDER = gql`
  mutation PlaceOrder($input: PlaceOrderInput!) {
    placeOrder(input: $input) {
      id
      orderNumber
      total
      status
    }
  }
`;

export const MY_ORDERS = gql`
  query MyOrders {
    myOrders {
      id
      orderNumber
      total
      status
      placedAt
      items { name qty }
    }
  }
`;

export const ORDER = gql`
  query Order($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      status
      subtotal
      discount
      deliveryFee
      total
      couponCode
      paymentMethod
      placedAt
      items { name price qty spiceLevel }
      address { line1 line2 city pincode phone }
      statusHistory { status at }
    }
  }
`;

export const CANCEL_ORDER = gql`
  mutation CancelOrder($id: ID!) {
    cancelOrder(id: $id) {
      id
      status
    }
  }
`;
