import { gql } from "@apollo/client";
import { SETTINGS_CORE_FIELDS, INTEGRATION_SETTINGS_FIELDS } from "./queries";

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

export const SUBMIT_SURVEY = gql`
  mutation SubmitOrderSurvey($orderId: ID!, $token: String!, $itemRatings: [ItemRatingInput!]!, $delivery: Int!, $comment: String) {
    submitOrderSurvey(orderId: $orderId, token: $token, itemRatings: $itemRatings, delivery: $delivery, comment: $comment)
  }
`;

export const CREATE_MANUAL_ORDER = gql`
  mutation CreateManualOrder($input: ManualOrderInput!) {
    createManualOrder(input: $input) {
      id
      orderNumber
    }
  }
`;

export const UPDATE_MANUAL_ORDER = gql`
  mutation UpdateManualOrder($id: ID!, $input: ManualOrderInput!) {
    updateManualOrder(id: $id, input: $input) {
      id
      orderNumber
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

export const CREATE_SLIDER = gql`
  mutation CreateBanner($input: BannerInput!) {
    createBanner(input: $input) {
      id
    }
  }
`;
export const UPDATE_SLIDER = gql`
  mutation UpdateBanner($id: ID!, $input: BannerInput!) {
    updateBanner(id: $id, input: $input) {
      id
    }
  }
`;
export const DELETE_SLIDER = gql`
  mutation DeleteBanner($id: ID!) {
    deleteBanner(id: $id)
  }
`;

export const CREATE_SOCIETY = gql`
  mutation CreateSociety($input: SocietyInput!) {
    createSociety(input: $input) {
      id
    }
  }
`;
export const UPDATE_SOCIETY = gql`
  mutation UpdateSociety($id: ID!, $input: SocietyInput!) {
    updateSociety(id: $id, input: $input) {
      id
    }
  }
`;
export const DELETE_SOCIETY = gql`
  mutation DeleteSociety($id: ID!) {
    deleteSociety(id: $id)
  }
`;

export const DELETE_ORDER = gql`
  mutation DeleteOrder($id: ID!) {
    deleteOrder(id: $id)
  }
`;
export const DELETE_ORDERS = gql`
  mutation DeleteOrders($ids: [ID!]!) {
    deleteOrders(ids: $ids)
  }
`;

export const UPDATE_STAFF_USER = gql`
  mutation UpdateStaffUser($id: ID!, $name: String, $phone: String, $password: String, $isActive: Boolean) {
    updateStaffUser(id: $id, name: $name, phone: $phone, password: $password, isActive: $isActive) {
      id
      name
      phone
      isActive
    }
  }
`;
export const DELETE_STAFF_USER = gql`
  mutation DeleteStaffUser($id: ID!) {
    deleteStaffUser(id: $id)
  }
`;

export const SEND_TEST_EMAIL = gql`
  mutation SendTestEmail($to: String) {
    sendTestEmail(to: $to)
  }
`;

export const DELETE_SUPPORT_TICKET = gql`
  mutation DeleteSupportTicket($ticketId: ID!) {
    deleteSupportTicket(ticketId: $ticketId)
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $name: String, $phone: String) {
    updateCustomer(id: $id, name: $name, phone: $phone) {
      id
      name
      phone
    }
  }
`;
export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

export const CREATE_MANUAL_PAYMENT = gql`
  mutation CreateManualPayment(
    $orderId: ID!
    $amount: Float!
    $method: String
    $status: PaymentRecordStatus
    $reference: String
    $note: String
  ) {
    createManualPayment(orderId: $orderId, amount: $amount, method: $method, status: $status, reference: $reference, note: $note) {
      id
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $phone: String) {
    updateProfile(name: $name, phone: $phone) {
      id
      name
      email
      phone
      role
    }
  }
`;

export const CREATE_LEAD = gql`
  mutation CreateLead(
    $name: String!
    $phone: String!
    $email: String
    $note: String
    $address: String
    $society: String
    $block: String
    $flat: String
  ) {
    createLead(name: $name, phone: $phone, email: $email, note: $note, address: $address, society: $society, block: $block, flat: $flat) {
      id
    }
  }
`;
export const UPDATE_LEAD = gql`
  mutation UpdateLead(
    $id: ID!
    $name: String
    $phone: String
    $email: String
    $note: String
    $address: String
    $society: String
    $block: String
    $flat: String
  ) {
    updateLead(id: $id, name: $name, phone: $phone, email: $email, note: $note, address: $address, society: $society, block: $block, flat: $flat) {
      id
    }
  }
`;
export const DELETE_LEAD = gql`
  mutation DeleteLead($id: ID!) {
    deleteLead(id: $id)
  }
`;

export const UPDATE_PARTY_ORDER_STATUS = gql`
  mutation UpdatePartyOrderStatus($id: ID!, $status: PartyOrderStatus!) {
    updatePartyOrderStatus(id: $id, status: $status) {
      id
      status
    }
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
      ${SETTINGS_CORE_FIELDS}
    }
  }
`;

export const UPDATE_INTEGRATION_SETTINGS = gql`
  mutation UpdateIntegrationSettings($input: IntegrationSettingsInput!) {
    updateIntegrationSettings(input: $input) {
      ${INTEGRATION_SETTINGS_FIELDS}
    }
  }
`;

export const ASSIGN_RIDER = gql`
  mutation AssignDeliveryPartner($orderId: ID!, $riderId: ID!) {
    assignDeliveryPartner(orderId: $orderId, riderId: $riderId) {
      id
      deliveryPartner {
        id
        name
        phone
      }
    }
  }
`;

export const CREATE_STAFF_USER = gql`
  mutation CreateStaffUser(
    $name: String!
    $email: String!
    $phone: String
    $password: String!
    $role: Role!
  ) {
    createStaffUser(name: $name, email: $email, phone: $phone, password: $password, role: $role) {
      id
      name
      email
    }
  }
`;

export const EMAIL_ADMIN_CREDENTIALS = gql`
  mutation EmailAdminCredentials($email: String!, $captchaId: String!, $captchaAnswer: String!) {
    emailAdminCredentials(email: $email, captchaId: $captchaId, captchaAnswer: $captchaAnswer)
  }
`;

export const REPLY_TICKET = gql`
  mutation ReplySupportTicket($ticketId: ID!, $text: String!) {
    replySupportTicket(ticketId: $ticketId, text: $text) {
      id
      status
      messages {
        by
        text
        at
      }
    }
  }
`;

export const UPDATE_TICKET_STATUS = gql`
  mutation UpdateSupportTicketStatus($ticketId: ID!, $status: TicketStatus!) {
    updateSupportTicketStatus(ticketId: $ticketId, status: $status) {
      id
      status
    }
  }
`;

export const UPLOAD_IMAGE = gql`
  mutation UploadImage($file: String!, $fileName: String!, $folder: String) {
    uploadImage(file: $file, fileName: $fileName, folder: $folder) {
      url
      fileId
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

export const SEND_CAMPAIGN = gql`
  mutation SendCampaign($input: CampaignInput!) {
    sendCampaign(input: $input) {
      id
      status
    }
  }
`;
