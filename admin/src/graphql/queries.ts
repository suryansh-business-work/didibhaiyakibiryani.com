import { gql } from "@apollo/client";

export const ME = gql`
  query Me {
    me {
      id
      name
      email
      role
    }
  }
`;

export const DASHBOARD = gql`
  query Dashboard {
    dashboardStats {
      totalOrders
      totalRevenue
      todayOrders
      todayRevenue
      pendingOrders
      totalCustomers
      avgOrderValue
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

export const ORDERS = gql`
  query Orders($status: OrderStatus) {
    orders(status: $status) {
      id
      orderNumber
      total
      subtotal
      discount
      deliveryFee
      status
      paymentMethod
      paymentStatus
      couponCode
      placedAt
      notes
      user {
        name
        phone
        email
      }
      address {
        line1
        line2
        city
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

export const MENU_ITEMS = gql`
  query MenuItems($categoryId: ID, $search: String) {
    menuItems(categoryId: $categoryId, search: $search) {
      id
      name
      description
      price
      image
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
  codEnabled
  onlineEnabled
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

export const SETTINGS = gql`
  query Settings {
    settings {
      ${SETTINGS_CORE_FIELDS}
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
