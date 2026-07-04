import { gql } from "@apollo/client";

export const APP_SETTINGS = gql`
  query AppSettings {
    settings {
      brandName
      logoUrl
      tagline
      fontFamily
      allCategoryImage
      rewardsProgramName
      storeOpenTime
      storeCloseTime
      storeOpenNow
      minDeliveryCost
      perKmCharge
      freeDeliveryAbove
      codEnabled
      onlineEnabled
      supportPhone
      supportSubjects
      maintenance {
        native
      }
    }
  }
`;

export const ORDER_TICKETS = gql`
  query OrderTickets($orderId: ID!) {
    orderTickets(orderId: $orderId) {
      id
      subject
      body
      imageUrl
      status
      createdAt
      messages {
        by
        text
        at
      }
    }
  }
`;

export const CREATE_SUPPORT_TICKET = gql`
  mutation CreateSupportTicket($orderId: ID!, $subject: String!, $body: String!, $imageUrl: String) {
    createSupportTicket(orderId: $orderId, subject: $subject, body: $body, imageUrl: $imageUrl) {
      id
      status
    }
  }
`;

export const REPLY_SUPPORT_TICKET = gql`
  mutation ReplySupportTicket($ticketId: ID!, $text: String!) {
    replySupportTicket(ticketId: $ticketId, text: $text) {
      id
      messages {
        by
        text
        at
      }
    }
  }
`;

export const UPLOAD_SUPPORT_IMAGE = gql`
  mutation UploadSupportImage($file: String!, $fileName: String!) {
    uploadSupportImage(file: $file, fileName: $fileName) {
      url
    }
  }
`;

export const RATE_ORDER = gql`
  mutation RateOrder($orderId: ID!, $food: Int!, $delivery: Int!, $comment: String) {
    rateOrder(orderId: $orderId, food: $food, delivery: $delivery, comment: $comment) {
      id
      rating {
        food
        delivery
        comment
      }
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $phone: String, $avatarUrl: String, $dob: String, $anniversary: String) {
    updateProfile(name: $name, phone: $phone, avatarUrl: $avatarUrl, dob: $dob, anniversary: $anniversary) {
      id
      name
      phone
      avatarUrl
      dob
      anniversary
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

export const ME = gql`
  query Me {
    me {
      id
      name
      email
      phone
      avatarUrl
      dob
      anniversary
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

export const REQUEST_SIGNUP_OTP = gql`
  mutation RequestSignupOtp($email: String!, $name: String!) {
    requestSignupOtp(email: $email, name: $name)
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

export const REMOVE_ADDRESS = gql`
  mutation RemoveAddress($addressId: ID!) {
    removeAddress(addressId: $addressId) {
      id
      addresses { id label line1 line2 city pincode isDefault }
    }
  }
`;

export const SET_DEFAULT_ADDRESS = gql`
  mutation SetDefaultAddress($addressId: ID!) {
    setDefaultAddress(addressId: $addressId) {
      id
      addresses { id label line1 line2 city pincode isDefault }
    }
  }
`;

export const HOME_DATA = gql`
  query HomeData {
    banners(activeOnly: true) {
      id
      imageUrl
      title
      subtitle
      linkUrl
    }
    categories(activeOnly: true) {
      id
      name
      image
    }
    menuItems {
      id
      name
      description
      price
      image
      spiceSelectable
      spiceLevel
      serves
      badge
      isVeg
      isAvailable
      rating
      ratingCount
      category { id name }
    }
  }
`;

export const MY_REWARDS = gql`
  query MyRewards {
    myRewards {
      enabled
      points
      pointsPerOrder
      pointsMinOrder
      pointsPerReward
      rewardsAvailable
      rewardName
      rewardItem { id name image }
    }
  }
`;

export const REDEEM_REWARD = gql`
  mutation RedeemReward {
    redeemReward {
      code
      points
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
      image
      spiceSelectable
      spiceLevel
      serves
      badge
      isVeg
      isAvailable
      rating
      ratingCount
      category { id name }
    }
  }
`;

export const SOCIETIES = gql`
  query Societies {
    societies(activeOnly: true) {
      id
      name
      area
      pincode
    }
  }
`;

export const CAPTCHA = gql`
  query Captcha {
    captcha {
      id
      question
    }
  }
`;

export const SUBMIT_PARTY_ORDER = gql`
  mutation SubmitPartyOrder($input: PartyOrderInput!, $captchaId: String!, $captchaAnswer: String!) {
    submitPartyOrder(input: $input, captchaId: $captchaId, captchaAnswer: $captchaAnswer)
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
      orderType
      placedAt
      items {
        name
        qty
        menuItem { id name price image spiceSelectable spiceLevel isAvailable isVeg }
      }
    }
  }
`;

export const ORDER = gql`
  query Order($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      status
      orderType
      subtotal
      discount
      deliveryFee
      total
      couponCode
      paymentMethod
      paymentStatus
      placedAt
      items { name price qty spiceLevel menuItem { id name price spiceLevel spiceSelectable isAvailable } }
      address { line1 line2 city pincode phone lat lng }
      deliveryPartner { id name phone }
      statusHistory { status at }
      rating { food delivery comment }
    }
  }
`;

export const TRACK_ORDER = gql`
  query TrackOrder($orderNumber: String!) {
    trackOrder(orderNumber: $orderNumber) {
      status
      etaMinutes
      rider { lat lng at }
      destination { lat lng }
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
