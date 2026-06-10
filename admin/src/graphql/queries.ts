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

export const SETTINGS = gql`
  query Settings {
    settings {
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
