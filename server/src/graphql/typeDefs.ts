export const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum Role {
    CUSTOMER
    ADMIN
    STAFF
    DELIVERY
  }

  enum Badge {
    NONE
    BESTSELLER
    NEW
  }

  enum CouponType {
    PERCENT
    FLAT
    FREE_DELIVERY
    FREE_ITEM
  }

  enum OrderStatus {
    PLACED
    CONFIRMED
    PREPARING
    OUT_FOR_DELIVERY
    DELIVERED
    CANCELLED
  }

  enum PaymentMethod {
    COD
    ONLINE
  }

  enum PaymentStatus {
    PENDING
    PAID
    FAILED
    REFUNDED
  }

  # ─────────────── Types ───────────────
  type Address {
    id: ID!
    label: String!
    line1: String!
    line2: String
    city: String!
    pincode: String!
    lat: Float
    lng: Float
    isDefault: Boolean!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    role: Role!
    addresses: [Address!]!
    isActive: Boolean!
    createdAt: DateTime!
    orderCount: Int
    totalSpent: Float
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    image: String
    sortOrder: Int!
    isActive: Boolean!
    itemCount: Int
  }

  type MenuItem {
    id: ID!
    name: String!
    slug: String!
    description: String
    price: Float!
    image: String
    category: Category
    isVeg: Boolean!
    spiceLevel: Int!
    serves: String!
    badge: Badge!
    tags: [String!]!
    isAvailable: Boolean!
    rating: Float!
    ratingCount: Int!
    createdAt: DateTime!
  }

  type Coupon {
    id: ID!
    code: String!
    title: String!
    description: String
    type: CouponType!
    value: Float!
    maxDiscount: Float
    minOrder: Float!
    freeItem: MenuItem
    appOnly: Boolean!
    firstOrderOnly: Boolean!
    isActive: Boolean!
    usageLimit: Int
    usedCount: Int!
    validFrom: DateTime
    validTo: DateTime
  }

  type CouponResult {
    valid: Boolean!
    message: String!
    discount: Float
    coupon: Coupon
  }

  type OrderItem {
    name: String!
    price: Float!
    qty: Int!
    spiceLevel: Int
    menuItem: MenuItem
  }

  type OrderAddress {
    label: String
    line1: String!
    line2: String
    city: String!
    pincode: String!
    phone: String
  }

  type StatusEvent {
    status: OrderStatus!
    at: DateTime!
    note: String
  }

  type Order {
    id: ID!
    orderNumber: String!
    user: User
    items: [OrderItem!]!
    subtotal: Float!
    discount: Float!
    deliveryFee: Float!
    total: Float!
    couponCode: String
    status: OrderStatus!
    paymentMethod: PaymentMethod!
    paymentStatus: PaymentStatus!
    address: OrderAddress!
    statusHistory: [StatusEvent!]!
    notes: String
    placedAt: DateTime!
  }

  type Review {
    id: ID!
    rating: Int!
    text: String
    authorName: String!
    authorMeta: String
    createdAt: DateTime!
  }

  type TopItem {
    menuItem: MenuItem
    name: String!
    qty: Int!
    revenue: Float!
  }

  type RevenuePoint {
    date: String!
    revenue: Float!
    orders: Int!
  }

  type DashboardStats {
    totalOrders: Int!
    totalRevenue: Float!
    todayOrders: Int!
    todayRevenue: Float!
    pendingOrders: Int!
    totalCustomers: Int!
    avgOrderValue: Float!
    topItems: [TopItem!]!
    revenueByDay: [RevenuePoint!]!
    recentOrders: [Order!]!
  }

  # ─────────────── Inputs ───────────────
  input RegisterInput {
    name: String!
    email: String!
    phone: String
    password: String!
  }

  input AddressInput {
    label: String
    line1: String!
    line2: String
    city: String!
    pincode: String!
    lat: Float
    lng: Float
    phone: String
    isDefault: Boolean
  }

  input CategoryInput {
    name: String!
    description: String
    image: String
    sortOrder: Int
    isActive: Boolean
  }

  input MenuItemInput {
    name: String!
    description: String
    price: Float!
    image: String
    categoryId: ID!
    spiceLevel: Int
    serves: String
    badge: Badge
    tags: [String!]
    isAvailable: Boolean
  }

  input CouponInput {
    code: String!
    title: String!
    description: String
    type: CouponType!
    value: Float
    maxDiscount: Float
    minOrder: Float
    freeItemId: ID
    appOnly: Boolean
    firstOrderOnly: Boolean
    isActive: Boolean
    usageLimit: Int
    validFrom: DateTime
    validTo: DateTime
  }

  input CartItemInput {
    menuItemId: ID!
    qty: Int!
    spiceLevel: Int
  }

  input PlaceOrderInput {
    items: [CartItemInput!]!
    address: AddressInput!
    couponCode: String
    paymentMethod: PaymentMethod
    notes: String
  }

  # ─────────────── Queries ───────────────
  type Settings {
    brandName: String!
    tagline: String!
    logoUrl: String!
    primaryColor: String!
    accentColor: String!
    companyName: String!
    companyAddress: String!
    companyPhone: String!
    companyEmail: String!
    supportPhone: String!
    supportEmail: String!
    fssaiLicense: String!
    instagramUrl: String!
    facebookUrl: String!
    youtubeUrl: String!
    updatedAt: DateTime!
  }

  input SettingsInput {
    brandName: String
    tagline: String
    logoUrl: String
    primaryColor: String
    accentColor: String
    companyName: String
    companyAddress: String
    companyPhone: String
    companyEmail: String
    supportPhone: String
    supportEmail: String
    fssaiLicense: String
    instagramUrl: String
    facebookUrl: String
    youtubeUrl: String
  }

  enum PaymentRecordStatus {
    CREATED
    CAPTURED
    FAILED
    REFUNDED
    PARTIALLY_REFUNDED
  }

  type PaymentRefund {
    providerRefundId: String!
    amount: Float!
    reason: String
    at: DateTime!
  }

  type PaymentEvent {
    type: String!
    at: DateTime!
    data: String
  }

  type Payment {
    id: ID!
    order: Order
    provider: String!
    providerOrderId: String!
    providerPaymentId: String
    amount: Float!
    currency: String!
    status: PaymentRecordStatus!
    method: String
    refunds: [PaymentRefund!]!
    events: [PaymentEvent!]!
    createdAt: DateTime!
  }

  type RazorpayOrderPayload {
    keyId: String!
    razorpayOrderId: String!
    amount: Int! # paise
    currency: String!
  }

  input VerifyPaymentInput {
    orderId: ID!
    razorpayOrderId: String!
    razorpayPaymentId: String!
    razorpaySignature: String!
  }

  enum CampaignChannel {
    EMAIL
    WHATSAPP
  }

  enum CampaignStatus {
    DRAFT
    SENDING
    SENT
    FAILED
  }

  type Campaign {
    id: ID!
    name: String!
    channel: CampaignChannel!
    subject: String!
    body: String!
    ctaLabel: String
    ctaUrl: String
    status: CampaignStatus!
    audienceCount: Int!
    sentCount: Int!
    failedCount: Int!
    sentAt: DateTime
    createdAt: DateTime!
  }

  input CampaignInput {
    name: String!
    channel: CampaignChannel!
    subject: String!
    body: String!
    ctaLabel: String
    ctaUrl: String
  }

  type Query {
    me: User

    settings: Settings!

    payments(status: PaymentRecordStatus): [Payment!]! # admin
    campaigns: [Campaign!]! # admin

    categories(activeOnly: Boolean): [Category!]!
    menuItems(categoryId: ID, search: String, availableOnly: Boolean): [MenuItem!]!
    menuItem(id: ID, slug: String): MenuItem

    coupons(activeOnly: Boolean): [Coupon!]!
    validateCoupon(code: String!, subtotal: Float!): CouponResult!

    myOrders: [Order!]!
    order(id: ID!): Order
    orders(status: OrderStatus): [Order!]! # admin/staff

    reviews(limit: Int): [Review!]!

    customers(search: String): [User!]! # admin
    dashboardStats: DashboardStats! # admin
  }

  # ─────────────── Mutations ───────────────
  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(emailOrPhone: String!, password: String!): AuthPayload!
    updateProfile(name: String, phone: String): User!
    addAddress(input: AddressInput!): User!
    removeAddress(addressId: ID!): User!

    # Catalogue (admin)
    createCategory(input: CategoryInput!): Category!
    updateCategory(id: ID!, input: CategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    createMenuItem(input: MenuItemInput!): MenuItem!
    updateMenuItem(id: ID!, input: MenuItemInput!): MenuItem!
    deleteMenuItem(id: ID!): Boolean!
    toggleItemAvailability(id: ID!): MenuItem!

    # Coupons (admin)
    createCoupon(input: CouponInput!): Coupon!
    updateCoupon(id: ID!, input: CouponInput!): Coupon!
    deleteCoupon(id: ID!): Boolean!

    # Orders
    placeOrder(input: PlaceOrderInput!): Order!
    cancelOrder(id: ID!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!, note: String): Order! # admin/staff

    # Branding & company settings (admin)
    updateSettings(input: SettingsInput!): Settings!

    # Payments (Razorpay)
    createRazorpayOrder(orderId: ID!): RazorpayOrderPayload!
    verifyRazorpayPayment(input: VerifyPaymentInput!): Order!
    refundPayment(paymentId: ID!, amount: Float, reason: String): Payment! # admin

    # Password reset (OTP over email)
    requestPasswordReset(email: String!): Boolean!
    resetPassword(email: String!, otp: String!, newPassword: String!): Boolean!

    # Campaigns (admin)
    sendCampaign(input: CampaignInput!): Campaign!
  }
`;
