import { gql } from "@apollo/client";

export const ME = gql`
  query Me {
    me {
      id
      name
      email
      phone
      role
    }
  }
`;

export const DASHBOARD = gql`
  query Dashboard($from: DateTime, $to: DateTime) {
    dashboardStats(from: $from, to: $to) {
      totalOrders
      totalRevenue
      todayOrders
      todayRevenue
      pendingOrders
      totalCustomers
      totalLeads
      repeatCustomers
      avgOrderValue
      avgFoodRating
      avgDeliveryRating
      ratingCount
      periodOrders
      periodRevenue
      periodExpenses
      expenseCategoryCount
      expenseBySource {
        name
        color
        total
      }
      expenseByItem {
        name
        total
      }
      ordersByStatus {
        status
        count
      }
      periodProfit
      periodComplimentary
      dishRatings {
        name
        rating
        count
      }
      topItems {
        name
        qty
        revenue
      }
      revenueByDay {
        date
        revenue
        orders
      }
      recentOrders {
        id
        orderNumber
        total
        status
        placedAt
        user {
          name
        }
      }
    }
  }
`;

export const PROFIT_ITEMS = gql`
  query ProfitItems($from: DateTime, $to: DateTime) {
    profitItems(from: $from, to: $to) {
      name
      price
      makingCost
      qty
    }
  }
`;

export const COMPLIMENTARY_ITEMS_PAGE = gql`
  query ComplimentaryItemsPage($from: DateTime, $to: DateTime, $search: String, $sortBy: String, $sortDir: SortDir, $limit: Int, $offset: Int) {
    complimentaryItemsPage(from: $from, to: $to, search: $search, sortBy: $sortBy, sortDir: $sortDir, limit: $limit, offset: $offset) {
      total
      items {
        orderNumber
        name
        qty
        value
        placedAt
      }
    }
  }
`;

const ORDER_FIELDS = `
  id
  orderNumber
  total
  subtotal
  discount
  deliveryFee
  status
  orderType
  source
  paymentMethod
  paymentStatus
  couponCode
  placedAt
  notes
  surveyUrl
  ratingToken
  trackingUrl
  ratingUrl
  receiptUrl
  customerName
  customerPhone
  customerOrderCount
  user {
    id
    name
    phone
    email
  }
  address {
    line1
    line2
    city
    state
    pincode
    phone
    lat
    lng
  }
  items {
    name
    price
    qty
    spiceLevel
    complimentary
  }
  statusHistory {
    status
    at
    note
  }
  deliveryPartner {
    id
    name
    phone
  }
  rating {
    food
    delivery
    comment
    items {
      name
      rating
    }
  }
`;

export const ORDERS = gql`
  query Orders($status: OrderStatus) {
    orders(status: $status) {
      ${ORDER_FIELDS}
    }
  }
`;

export const ORDERS_PAGE = gql`
  query OrdersPage($status: OrderStatus, $userId: ID, $phone: String, $search: String, $sortBy: String, $sortDir: SortDir, $limit: Int, $offset: Int) {
    ordersPage(status: $status, userId: $userId, phone: $phone, search: $search, sortBy: $sortBy, sortDir: $sortDir, limit: $limit, offset: $offset) {
      total
      items {
        ${ORDER_FIELDS}
      }
    }
  }
`;

export const RIDERS = gql`
  query Riders {
    riders {
      id
      name
      email
      phone
      isActive
      createdAt
    }
  }
`;

export const CATEGORIES = gql`
  query Categories {
    categories {
      id
      name
      slug
      description
      sortOrder
      isActive
      itemCount
    }
  }
`;

export const SLIDERS = gql`
  query Sliders {
    banners {
      id
      imageUrl
      title
      subtitle
      linkUrl
      sortOrder
      isActive
    }
  }
`;

export const SOCIETIES = gql`
  query Societies {
    societies {
      id
      name
      area
      line1
      city
      state
      pincode
      lat
      lng
      sortOrder
      isActive
    }
  }
`;

export const EXPENSE_SOURCES = gql`
  query ExpenseSources {
    expenseSources {
      id
      type
      name
      phone
      email
      bankName
      accountNumber
      ifsc
      note
      color
      isActive
    }
  }
`;

export const EXPENSE_PRODUCTS = gql`
  query ExpenseProducts {
    expenseProducts {
      id
      name
      marketPrice
      priceUnit
    }
  }
`;

export const ORDERS_STATS = gql`
  query OrdersStats {
    ordersStats {
      totalOrders
      todayOrders
      todayRevenue
      pendingOrders
      totalRevenue
    }
  }
`;

export const EXPENSES_PAGE = gql`
  query ExpensesPage($sourceId: ID, $productId: ID, $from: DateTime, $to: DateTime, $search: String, $sortBy: String, $sortDir: SortDir, $limit: Int, $offset: Int) {
    expensesPage(sourceId: $sourceId, productId: $productId, from: $from, to: $to, search: $search, sortBy: $sortBy, sortDir: $sortDir, limit: $limit, offset: $offset) {
      total
      items {
        id
        title
        amount
        unit
        note
        date
        createdAt
        source {
          id
          name
          color
        }
        product {
          id
          name
          priceUnit
        }
      }
    }
  }
`;

export const LEADS_PAGE = gql`
  query LeadsPage($search: String, $sortBy: String, $sortDir: SortDir, $limit: Int, $offset: Int) {
    leadsPage(search: $search, sortBy: $sortBy, sortDir: $sortDir, limit: $limit, offset: $offset) {
      total
      items {
        id
        name
        phone
        email
        note
        address
        society
        block
        flat
        city
        state
        pincode
        lat
        lng
        createdAt
        orderCount
        totalSpent
      }
    }
  }
`;

export const LEADS = gql`
  query Leads($search: String) {
    leads(search: $search) {
      id
      name
      phone
      email
      note
      address
      society
      block
      flat
      city
      state
      pincode
      lat
      lng
      createdAt
    }
  }
`;

export const PARTY_ORDERS_PAGE = gql`
  query PartyOrdersPage($status: PartyOrderStatus, $search: String, $sortBy: String, $sortDir: SortDir, $limit: Int, $offset: Int) {
    partyOrdersPage(status: $status, search: $search, sortBy: $sortBy, sortDir: $sortDir, limit: $limit, offset: $offset) {
      total
      items {
        id
        name
        phone
        email
        eventDate
        eventTime
        guests
        location
        line1
        city
        state
        pincode
        message
        status
        createdAt
      }
    }
  }
`;

export const PARTY_ORDERS = gql`
  query PartyOrders($status: PartyOrderStatus) {
    partyOrders(status: $status) {
      id
      name
      phone
      email
      eventDate
      guests
      location
      message
      status
      createdAt
    }
  }
`;

export const MENU_ITEMS = gql`
  query MenuItems($categoryId: ID, $search: String) {
    menuItems(categoryId: $categoryId, search: $search) {
      id
      name
      description
      price
      makingCost
      image
      spiceSelectable
      spiceLevel
      serves
      badge
      tags
      isAvailable
      rating
      ratingCount
      category {
        id
        name
      }
    }
  }
`;

export const COUPONS = gql`
  query Coupons {
    coupons {
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
      isActive
      usageLimit
      usedCount
      freeItem {
        id
        name
      }
    }
  }
`;

export const RECEIPT_PDF = gql`
  query ReceiptPdf($orderId: ID!) {
    receiptPdf(orderId: $orderId)
  }
`;

export const SURVEY_ORDER = gql`
  query SurveyOrder($orderId: ID!, $token: String!) {
    surveyOrder(orderId: $orderId, token: $token) {
      orderNumber
      customerName
      subtotal
      discount
      deliveryFee
      total
      status
      placedAt
      alreadyRated
      canRate
      items {
        name
        price
        qty
        spiceLevel
      }
      rating {
        food
        delivery
        comment
        items {
          name
          rating
        }
      }
    }
  }
`;

export const CUSTOMERS = gql`
  query Customers($search: String) {
    customers(search: $search) {
      id
      name
      email
      phone
      createdAt
      orderCount
      totalSpent
    }
  }
`;

export const CUSTOMERS_PAGE = gql`
  query CustomersPage($search: String, $sortBy: String, $sortDir: SortDir, $limit: Int, $offset: Int) {
    customersPage(search: $search, sortBy: $sortBy, sortDir: $sortDir, limit: $limit, offset: $offset) {
      total
      items {
        id
        name
        email
        phone
        createdAt
        orderCount
        totalSpent
      }
    }
  }
`;

export const SETTINGS_CORE_FIELDS = `
  brandName
  tagline
  logoUrl
  websiteHeaderLogoUrl
  websiteFooterLogoUrl
  faviconUrl
  consumerAppName
  consumerSplashUrl
  consumerIconUrl
  deliveryAppName
  deliverySplashUrl
  deliveryIconUrl
  primaryColor
  accentColor
  fontFamily
  companyName
  companyAddress
  companyPhone
  companyEmail
  supportPhone
  supportEmail
  feedbackEmail
  website
  fssaiLicense
  instagramUrl
  facebookUrl
  youtubeUrl
  maintenance {
    website
    server
    admin
    native
    delivery
  }
  storeOpenTime
  storeCloseTime
  storeTimezone
  storeOpenNow
  minDeliveryCost
  perKmCharge
  freeDeliveryAbove
  storeLat
  storeLng
  gstLegalName
  gstNumber
  surveyUrl
  surveyMessageTemplate
  trackingMessageTemplate
  receiptMessageTemplate
  codEnabled
  onlineEnabled
  loyaltyEnabled
  pointsPerOrder
  pointsMinOrder
  pointsPerReward
  rewardItem { id name }
  rewardName
  supportSubjects
  updatedAt
`;

export const CAPTCHA = gql`
  query Captcha {
    captcha {
      id
      question
    }
  }
`;

export const SUPPORT_TICKETS = gql`
  query SupportTickets($status: TicketStatus) {
    supportTickets(status: $status) {
      id
      subject
      body
      imageUrl
      status
      createdAt
      updatedAt
      messages {
        by
        text
        at
      }
      order {
        id
        orderNumber
      }
      user {
        name
        email
        phone
      }
    }
  }
`;

export const SUPPORT_TICKETS_PAGE = gql`
  query SupportTicketsPage($status: TicketStatus, $search: String, $sortBy: String, $sortDir: SortDir, $limit: Int, $offset: Int) {
    supportTicketsPage(status: $status, search: $search, sortBy: $sortBy, sortDir: $sortDir, limit: $limit, offset: $offset) {
      total
      items {
        id
        subject
        body
        imageUrl
        status
        createdAt
        updatedAt
        messages {
          by
          text
          at
        }
        order {
          id
          orderNumber
        }
        user {
          name
          email
          phone
        }
      }
    }
  }
`;

export const SETTINGS = gql`
  query Settings {
    settings {
      ${SETTINGS_CORE_FIELDS}
    }
  }
`;

export const BRAND_THEME = gql`
  query BrandTheme {
    settings {
      fontFamily
      primaryColor
    }
  }
`;

export const INTEGRATION_SETTINGS_FIELDS = `
  smtpHost
  smtpPort
  smtpUser
  mailFrom
  mailFromName
  smtpPassSet
  smtpConfigured
  imagekitUrlEndpoint
  imagekitPublicKey
  imagekitPrivateKeySet
  imagekitConfigured
`;

export const INTEGRATION_SETTINGS = gql`
  query IntegrationSettings {
    integrationSettings {
      ${INTEGRATION_SETTINGS_FIELDS}
    }
  }
`;

export const PAYMENTS = gql`
  query Payments($status: PaymentRecordStatus) {
    payments(status: $status) {
      id
      provider
      providerOrderId
      providerPaymentId
      amount
      currency
      status
      method
      createdAt
      order {
        id
        orderNumber
        paymentStatus
      }
      refunds {
        providerRefundId
        amount
        reason
        at
      }
      events {
        type
        at
        data
      }
    }
  }
`;

export const PAYMENTS_PAGE = gql`
  query PaymentsPage($status: PaymentRecordStatus, $search: String, $sortBy: String, $sortDir: SortDir, $limit: Int, $offset: Int) {
    paymentsPage(status: $status, search: $search, sortBy: $sortBy, sortDir: $sortDir, limit: $limit, offset: $offset) {
      total
      items {
        id
        provider
        providerOrderId
        providerPaymentId
        amount
        currency
        status
        method
        createdAt
        order {
          id
          orderNumber
          paymentStatus
        }
        refunds {
          providerRefundId
          amount
          reason
          at
        }
        events {
          type
          at
          data
        }
      }
    }
  }
`;

export const CAMPAIGNS = gql`
  query Campaigns {
    campaigns {
      id
      name
      channel
      subject
      body
      ctaLabel
      ctaUrl
      status
      audienceCount
      sentCount
      failedCount
      sentAt
      createdAt
    }
  }
`;
