import { gql } from "@apollo/client";

export const SURVEY_ORDER = gql`
  query SurveyOrder($orderNumber: String!) {
    surveyOrder(orderNumber: $orderNumber) {
      orderNumber
      customerName
      status
      placedAt
      alreadyRated
      canRate
      receiptUrl
      items {
        name
        qty
        price
      }
      subtotal
      discount
      deliveryFee
      total
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

export const SUBMIT_ORDER_SURVEY = gql`
  mutation SubmitOrderSurvey(
    $orderNumber: String!
    $itemRatings: [ItemRatingInput!]!
    $delivery: Int!
    $comment: String
  ) {
    submitOrderSurvey(
      orderNumber: $orderNumber
      itemRatings: $itemRatings
      delivery: $delivery
      comment: $comment
    )
  }
`;

export interface SurveyItem {
  name: string;
  qty: number;
  price: number;
}

export interface ItemRating {
  name: string;
  rating: number;
}

export interface SurveyRating {
  food: number;
  delivery: number;
  comment?: string | null;
  items?: ItemRating[] | null;
}

export interface SurveyOrder {
  orderNumber: string;
  customerName?: string | null;
  status: string;
  placedAt?: string | null;
  alreadyRated: boolean;
  canRate: boolean;
  receiptUrl: string;
  items: SurveyItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  rating?: SurveyRating | null;
}
