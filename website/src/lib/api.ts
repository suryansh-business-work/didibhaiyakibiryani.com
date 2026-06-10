// Build-time data access for the marketing site. Products and offers come from
// the same GraphQL API the admin panel manages — so the website always reflects
// whatever staff configure. Values are fetched when the site is built.

const API_URL =
  import.meta.env.PUBLIC_API_URL || "https://server.didibhaiyakibiryani.com/graphql";

/** Where customers actually place orders (the Expo web app). */
export const ORDER_URL =
  import.meta.env.PUBLIC_ORDER_URL || "https://native.didibhaiyakibiryani.com";

export interface MenuProduct {
  name: string;
  price: number;
  desc: string;
  serves: string;
  spice: number;
  badge: "BESTSELLER" | "NEW" | "";
  hue: number;
  category: string;
}

interface RawItem {
  name: string;
  description?: string;
  price: number;
  spiceLevel?: number;
  serves?: string;
  badge?: string;
  category?: { name?: string } | null;
}

async function gql<T>(query: string): Promise<T | null> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = (await res.json()) as { data?: T };
    return json.data ?? null;
  } catch (err) {
    console.warn("[website] GraphQL fetch failed:", err);
    return null;
  }
}

const MENU_QUERY = `query {
  menuItems(availableOnly: true) {
    name description price spiceLevel serves badge category { name }
  }
}`;

function toBadge(badge?: string): MenuProduct["badge"] {
  if (badge === "BESTSELLER" || badge === "NEW") return badge;
  return "";
}

/** All available menu items, mapped to the ProductCard shape. */
export async function fetchMenu(): Promise<MenuProduct[]> {
  const data = await gql<{ menuItems: RawItem[] }>(MENU_QUERY);
  const items = data?.menuItems ?? [];
  return items.map((m, i) => ({
    name: m.name,
    price: m.price,
    desc: m.description ?? "",
    serves: m.serves ?? "",
    spice: m.spiceLevel ?? 0,
    badge: toBadge(m.badge),
    hue: (i * 9 + 12) % 40,
    category: m.category?.name ?? "",
  }));
}
