// Endpoints for the marketing site. Products are loaded in the browser from the
// same GraphQL API the admin panel manages, so the website always reflects what
// staff configure — live, with no rebuild needed. (Build-time fetching is avoided
// because the CI build container cannot reliably reach the public API.)

export const API_URL =
  import.meta.env.PUBLIC_API_URL || "https://server.didibhaiyakibiryani.com/graphql";

/** Where customers actually place orders (the Expo web app). */
export const ORDER_URL =
  import.meta.env.PUBLIC_ORDER_URL || "https://native.didibhaiyakibiryani.com";
