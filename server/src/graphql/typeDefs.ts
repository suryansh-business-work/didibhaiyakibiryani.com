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

  enum OrderType {
    DELIVERY
    TAKEAWAY
  }

  enum OrderSource {
    APP
    POS
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
    spiceSelectable: Boolean!
    spiceLevel: Int!
    serves: String!
    badge: Badge!
    tags: [String!]!
    isAvailable: Boolean!
    rating: Float!
    ratingCount: Int!
    createdAt: DateTime!
  }

  type Banner {
    id: ID!
    imageUrl: String!
    title: String
    subtitle: String
    linkUrl: String
    sortOrder: Int!
    isActive: Boolean!
    createdAt: DateTime!
  }

  type Society {
    id: ID!
    name: String!
    area: String
    line1: String
    city: String
    state: String
    pincode: String
    sortOrder: Int!
    isActive: Boolean!
    createdAt: DateTime!
  }

  enum ExpenseSourceType {
    PERSON
    ACCOUNT
  }

  type ExpenseSource {
    id: ID!
    type: ExpenseSourceType!
    name: String!
    phone: String
    email: String
    bankName: String
    accountNumber: String
    ifsc: String
    note: String
    isActive: Boolean!
    createdAt: DateTime!
  }

  type Expense {
    id: ID!
    source: ExpenseSource
    title: String!
    amount: Float!
    note: String
    createdAt: DateTime!
  }

  enum PartyOrderStatus {
    NEW
    CONTACTED
    CLOSED
  }

  type PartyOrder {
    id: ID!
    name: String!
    phone: String!
    email: String!
    eventDate: String
    guests: Int
    location: String
    message: String
    status: PartyOrderStatus!
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
    lat: Float
    lng: Float
  }

  type StatusEvent {
    status: OrderStatus!
    at: DateTime!
    note: String
  }

  type ItemRating {
    name: String!
    rating: Int!
  }

  type OrderRating {
    food: Int!
    delivery: Int!
    comment: String
    items: [ItemRating!]
    ratedAt: DateTime!
  }

  input ItemRatingInput {
    name: String!
    rating: Int!
  }

  type Order {
    id: ID!
    orderNumber: String!
    user: User
    customerName: String
    customerPhone: String
    items: [OrderItem!]!
    subtotal: Float!
    discount: Float!
    deliveryFee: Float!
    total: Float!
    couponCode: String
    status: OrderStatus!
    orderType: OrderType!
    source: OrderSource!
    paymentMethod: PaymentMethod!
    paymentStatus: PaymentStatus!
    address: OrderAddress
    deliveryPartner: User
    statusHistory: [StatusEvent!]!
    rating: OrderRating
    surveyUrl: String
    ratingToken: String!
    notes: String
    placedAt: DateTime!
  }

  # Public projection of an order for the no-login feedback survey page.
  type SurveyOrder {
    orderNumber: String!
    customerName: String
    items: [OrderItem!]!
    subtotal: Float!
    discount: Float!
    deliveryFee: Float!
    total: Float!
    status: OrderStatus!
    placedAt: DateTime!
    alreadyRated: Boolean!
    canRate: Boolean!
    rating: OrderRating
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

  type DishRating {
    name: String!
    rating: Float!
    count: Int!
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
    avgFoodRating: Float!
    avgDeliveryRating: Float!
    ratingCount: Int!
    dishRatings: [DishRating!]!
    topItems: [TopItem!]!
    revenueByDay: [RevenuePoint!]!
    recentOrders: [Order!]!
  }

  # ─────────────── Inputs ───────────────
  input RegisterInput {
    name: String!
    email: String!
    password: String!
    otp: String!
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
    spiceSelectable: Boolean
    spiceLevel: Int
    serves: String
    badge: Badge
    tags: [String!]
    isAvailable: Boolean
  }

  input BannerInput {
    imageUrl: String!
    title: String
    subtitle: String
    linkUrl: String
    sortOrder: Int
    isActive: Boolean
  }

  input SocietyInput {
    name: String!
    area: String
    line1: String
    city: String
    state: String
    pincode: String
    sortOrder: Int
    isActive: Boolean
  }

  input ExpenseSourceInput {
    type: ExpenseSourceType!
    name: String!
    phone: String
    email: String
    bankName: String
    accountNumber: String
    ifsc: String
    note: String
    isActive: Boolean
  }

  input ExpenseInput {
    sourceId: ID!
    title: String!
    amount: Float!
    note: String
  }

  input PartyOrderInput {
    name: String!
    phone: String!
    email: String!
    eventDate: String
    guests: Int
    location: String
    message: String
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

  # POS line item: either a catalogue item (menuItemId, price from DB) or a
  # custom off-menu line (name + price supplied by staff).
  input ManualOrderItemInput {
    menuItemId: ID
    name: String
    price: Float
    qty: Int!
    spiceLevel: Int
  }

  # Staff-entered (POS) order. Bypasses store-hours/payment-enabled checks and
  # supports walk-ins, takeaway, manual pricing and back-dating.
  input ManualOrderInput {
    userId: ID
    customerName: String
    customerPhone: String
    orderType: OrderType!
    items: [ManualOrderItemInput!]!
    address: AddressInput
    discount: Float
    deliveryFee: Float
    paymentMethod: PaymentMethod
    paymentStatus: PaymentStatus
    status: OrderStatus
    placedAt: DateTime
    surveyUrl: String
    notes: String
  }

  # ─────────────── Queries ───────────────
  type MaintenanceFlags {
    website: Boolean!
    server: Boolean!
    admin: Boolean!
    native: Boolean!
    delivery: Boolean!
  }

  input MaintenanceInput {
    website: Boolean
    server: Boolean
    admin: Boolean
    native: Boolean
    delivery: Boolean
  }

  type Settings {
    brandName: String!
    tagline: String!
    logoUrl: String!
    websiteHeaderLogoUrl: String!
    websiteFooterLogoUrl: String!
    faviconUrl: String!
    consumerAppName: String!
    consumerSplashUrl: String!
    consumerIconUrl: String!
    deliveryAppName: String!
    deliverySplashUrl: String!
    deliveryIconUrl: String!
    primaryColor: String!
    accentColor: String!
    companyName: String!
    companyAddress: String!
    companyPhone: String!
    companyEmail: String!
    supportPhone: String!
    supportEmail: String!
    feedbackEmail: String!
    website: String!
    fssaiLicense: String!
    instagramUrl: String!
    facebookUrl: String!
    youtubeUrl: String!
    maintenance: MaintenanceFlags!
    storeOpenTime: String!
    storeCloseTime: String!
    storeTimezone: String!
    storeOpenNow: Boolean!
    minDeliveryCost: Float!
    perKmCharge: Float!
    freeDeliveryAbove: Float!
    storeLat: Float!
    storeLng: Float!
    gstLegalName: String!
    gstNumber: String!
    surveyUrl: String!
    surveyMessageTemplate: String!
    codEnabled: Boolean!
    onlineEnabled: Boolean!
    supportSubjects: [String!]!
    updatedAt: DateTime!
  }

  input SettingsInput {
    brandName: String
    tagline: String
    logoUrl: String
    websiteHeaderLogoUrl: String
    websiteFooterLogoUrl: String
    faviconUrl: String
    consumerAppName: String
    consumerSplashUrl: String
    consumerIconUrl: String
    deliveryAppName: String
    deliverySplashUrl: String
    deliveryIconUrl: String
    primaryColor: String
    accentColor: String
    companyName: String
    companyAddress: String
    companyPhone: String
    companyEmail: String
    supportPhone: String
    supportEmail: String
    feedbackEmail: String
    website: String
    fssaiLicense: String
    instagramUrl: String
    facebookUrl: String
    youtubeUrl: String
    maintenance: MaintenanceInput
    storeOpenTime: String
    storeCloseTime: String
    storeTimezone: String
    minDeliveryCost: Float
    perKmCharge: Float
    freeDeliveryAbove: Float
    storeLat: Float
    storeLng: Float
    gstLegalName: String
    gstNumber: String
    surveyUrl: String
    surveyMessageTemplate: String
    codEnabled: Boolean
    onlineEnabled: Boolean
    supportSubjects: [String!]
  }

  # Admin-only integration credentials. Secrets are never returned — only a
  # boolean flag tells the UI whether each one is currently set.
  type IntegrationSettings {
    smtpHost: String!
    smtpPort: String!
    smtpUser: String!
    mailFrom: String!
    mailFromName: String!
    smtpPassSet: Boolean!
    smtpConfigured: Boolean!
    imagekitUrlEndpoint: String!
    imagekitPublicKey: String!
    imagekitPrivateKeySet: Boolean!
    imagekitConfigured: Boolean!
  }

  input IntegrationSettingsInput {
    smtpHost: String
    smtpPort: String
    smtpUser: String
    smtpPass: String
    mailFrom: String
    mailFromName: String
    imagekitUrlEndpoint: String
    imagekitPublicKey: String
    imagekitPrivateKey: String
  }

  type UploadedImage {
    url: String!
    fileId: String!
  }

  type Captcha {
    id: String!
    question: String!
  }

  enum TicketStatus {
    OPEN
    IN_PROGRESS
    RESOLVED
  }

  type SupportMessage {
    by: String!
    text: String!
    at: DateTime!
  }

  type SupportTicket {
    id: ID!
    order: Order
    user: User
    subject: String!
    body: String!
    imageUrl: String
    status: TicketStatus!
    messages: [SupportMessage!]!
    createdAt: DateTime!
    updatedAt: DateTime!
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

    banners(activeOnly: Boolean): [Banner!]!
    societies(activeOnly: Boolean): [Society!]!
    partyOrders(status: PartyOrderStatus): [PartyOrder!]! # admin/staff

    expenseSources(activeOnly: Boolean): [ExpenseSource!]! # admin
    expenses: [Expense!]! # admin

    categories(activeOnly: Boolean): [Category!]!
    menuItems(categoryId: ID, search: String, availableOnly: Boolean): [MenuItem!]!
    menuItem(id: ID, slug: String): MenuItem

    coupons(activeOnly: Boolean): [Coupon!]!
    validateCoupon(code: String!, subtotal: Float!): CouponResult!

    myOrders: [Order!]!
    order(id: ID!): Order
    orders(status: OrderStatus): [Order!]! # admin/staff
    invoicePdf(orderId: ID!): String! # admin/staff — base64-encoded themed PDF
    surveyOrder(orderId: ID!, token: String!): SurveyOrder # public — no login

    riders: [User!]! # admin/staff
    deliveryQueue: [Order!]! # DELIVERY: my active assigned orders
    myDeliveries(limit: Int): [Order!]! # DELIVERY: my delivered orders (earnings)

    captcha: Captcha! # public: arithmetic challenge for sensitive actions

    myTickets: [SupportTicket!]!
    orderTickets(orderId: ID!): [SupportTicket!]! # owner or staff
    supportTickets(status: TicketStatus): [SupportTicket!]! # admin

    reviews(limit: Int): [Review!]!

    customers(search: String): [User!]! # admin
    leads(search: String): [Lead!]! # admin — non-signup contacts
    dashboardStats: DashboardStats! # admin

    integrationSettings: IntegrationSettings! # admin: SMTP / ImageKit config (secrets masked)
  }

  # A non-signup contact (lead), managed from admin → Contacts.
  type Lead {
    id: ID!
    name: String!
    phone: String!
    email: String
    note: String
    address: String
    society: String
    block: String
    flat: String
    createdAt: DateTime!
  }

  # ─────────────── Mutations ───────────────
  type Mutation {
    requestSignupOtp(email: String!, name: String!): Boolean!
    register(input: RegisterInput!): AuthPayload!
    login(emailOrPhone: String!, password: String!): AuthPayload!
    updateProfile(name: String, phone: String): User!
    addAddress(input: AddressInput!): User!
    removeAddress(addressId: ID!): User!

    # Catalogue (admin)
    createCategory(input: CategoryInput!): Category!
    updateCategory(id: ID!, input: CategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    # Home slider (admin)
    createBanner(input: BannerInput!): Banner!
    updateBanner(id: ID!, input: BannerInput!): Banner!
    deleteBanner(id: ID!): Boolean!

    # Societies / delivery areas (admin)
    createSociety(input: SocietyInput!): Society!
    updateSociety(id: ID!, input: SocietyInput!): Society!
    deleteSociety(id: ID!): Boolean!

    # Finance — expense sources & expenses (admin)
    createExpenseSource(input: ExpenseSourceInput!): ExpenseSource!
    updateExpenseSource(id: ID!, input: ExpenseSourceInput!): ExpenseSource!
    deleteExpenseSource(id: ID!): Boolean!
    createExpense(input: ExpenseInput!): Expense!
    updateExpense(id: ID!, input: ExpenseInput!): Expense!
    deleteExpense(id: ID!): Boolean!

    # Party order enquiries
    submitPartyOrder(input: PartyOrderInput!, captchaId: String!, captchaAnswer: String!): Boolean! # public, captcha-gated
    updatePartyOrderStatus(id: ID!, status: PartyOrderStatus!): PartyOrder! # admin/staff

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
    createManualOrder(input: ManualOrderInput!): Order! # admin/staff — POS
    updateManualOrder(id: ID!, input: ManualOrderInput!): Order! # admin/staff — POS edit
    cancelOrder(id: ID!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!, note: String): Order! # admin/staff
    rateOrder(orderId: ID!, food: Int!, delivery: Int!, comment: String): Order!
    submitOrderSurvey(orderId: ID!, token: String!, itemRatings: [ItemRatingInput!]!, delivery: Int!, comment: String): Boolean! # public — token-gated, per-item
    deleteOrder(id: ID!): Boolean! # admin
    deleteOrders(ids: [ID!]!): Int! # admin — bulk delete, returns count removed

    # Delivery management
    assignDeliveryPartner(orderId: ID!, riderId: ID!): Order! # admin/staff
    createStaffUser(name: String!, email: String!, phone: String, password: String!, role: Role!): User! # admin
    updateStaffUser(id: ID!, name: String, phone: String, password: String, isActive: Boolean): User! # admin
    deleteStaffUser(id: ID!): Boolean! # admin

    # Media (ImageKit)
    uploadImage(file: String!, fileName: String!, folder: String): UploadedImage! # admin
    uploadSupportImage(file: String!, fileName: String!): UploadedImage! # any signed-in user

    # Support (order help box)
    createSupportTicket(orderId: ID!, subject: String!, body: String!, imageUrl: String): SupportTicket!
    replySupportTicket(ticketId: ID!, text: String!): SupportTicket! # owner or admin
    updateSupportTicketStatus(ticketId: ID!, status: TicketStatus!): SupportTicket! # admin
    deleteSupportTicket(ticketId: ID!): Boolean! # admin

    # Admin access recovery: emails fresh credentials to the admin's own inbox
    emailAdminCredentials(email: String!, captchaId: String!, captchaAnswer: String!): Boolean!

    # Branding & company settings (admin)
    updateSettings(input: SettingsInput!): Settings!

    # Integration credentials — SMTP & ImageKit (admin); secrets write-only
    updateIntegrationSettings(input: IntegrationSettingsInput!): IntegrationSettings!
    sendTestEmail(to: String): Boolean! # admin — verify SMTP config

    # Customers (admin)
    updateCustomer(id: ID!, name: String, phone: String): User!
    deleteCustomer(id: ID!): Boolean!

    # Contacts / non-signup leads (admin)
    createLead(
      name: String!
      phone: String!
      email: String
      note: String
      address: String
      society: String
      block: String
      flat: String
    ): Lead!
    updateLead(
      id: ID!
      name: String
      phone: String
      email: String
      note: String
      address: String
      society: String
      block: String
      flat: String
    ): Lead!
    deleteLead(id: ID!): Boolean!

    # Payments (Razorpay)
    createRazorpayOrder(orderId: ID!): RazorpayOrderPayload!
    verifyRazorpayPayment(input: VerifyPaymentInput!): Order!
    refundPayment(paymentId: ID!, amount: Float, reason: String): Payment! # admin
    createManualPayment(
      orderId: ID!
      amount: Float!
      method: String
      status: PaymentRecordStatus
      reference: String
      note: String
    ): Payment! # admin — record an offline / manual payment

    # Password reset (OTP over email)
    requestPasswordReset(email: String!): Boolean!
    resetPassword(email: String!, otp: String!, newPassword: String!): Boolean!

    # Campaigns (admin)
    sendCampaign(input: CampaignInput!): Campaign!
  }
`;
