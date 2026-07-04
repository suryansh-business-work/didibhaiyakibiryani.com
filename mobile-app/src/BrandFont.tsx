import { useEffect } from "react";
import { Platform } from "react-native";
import { useSettings } from "./settings";

const SYSTEM = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function fontHref(family: string): string | null {
  if (!family) {
    return null;
  }
  return `https://fonts.googleapis.com/css2?family=${family.trim().replace(/ /g, "+")}:wght@400;500;600;700;800&display=swap`;
}

/**
 * Applies the admin-selected Google font on the WEB build by injecting the
 * stylesheet and setting the `--app-font` CSS variable that Tamagui's font
 * family reads (see tamagui.config). No-op on native (fonts must be bundled at
 * build time there); renders nothing.
 */
export function BrandFont() {
  const family = useSettings().fontFamily ?? "";
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }
    document.documentElement.style.setProperty("--app-font", family ? `'${family}', ${SYSTEM}` : SYSTEM);
    const href = fontHref(family);
    const existing = document.getElementById("brand-font") as HTMLLinkElement | null;
    if (!href) {
      existing?.remove();
      return;
    }
    const link = existing ?? document.createElement("link");
    link.id = "brand-font";
    link.rel = "stylesheet";
    if (link.href !== href) {
      link.href = href;
    }
    if (!existing) {
      document.head.appendChild(link);
    }
  }, [family]);
  return null;
}
