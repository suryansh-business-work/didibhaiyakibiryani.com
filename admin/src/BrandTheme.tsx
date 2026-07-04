import { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { BRAND_THEME } from "./graphql/queries";
import { fontStack, loadBrandFont } from "./brandFont";

interface Brand {
  fontFamily?: string;
  primaryColor?: string;
}

/**
 * Applies admin-configured branding (Google font + primary colour) to the whole
 * panel at runtime by overriding the `:root` CSS variables the stylesheet reads.
 * Renders nothing; mounted once at the app root so every page reflects changes
 * the moment they're saved — no rebuild.
 */
export default function BrandTheme() {
  const { data } = useQuery<{ settings: Brand }>(BRAND_THEME, { fetchPolicy: "cache-and-network", pollInterval: 30000 });
  const family = data?.settings?.fontFamily ?? "";
  const primary = data?.settings?.primaryColor ?? "";

  useEffect(() => {
    const root = document.documentElement.style;
    loadBrandFont(family);
    if (family) {
      const stack = fontStack(family);
      root.setProperty("--font", stack);
      root.setProperty("--display", stack);
    } else {
      root.removeProperty("--font");
      root.removeProperty("--display");
    }
  }, [family]);

  useEffect(() => {
    const root = document.documentElement.style;
    if (primary) {
      root.setProperty("--gold", primary);
    } else {
      root.removeProperty("--gold");
    }
  }, [primary]);

  return null;
}
