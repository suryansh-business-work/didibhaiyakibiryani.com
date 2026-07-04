export interface FontOption {
  label: string;
  value: string;
}

/** Curated Google Fonts offered in the admin Branding picker. Every app that
 *  consumes `settings.fontFamily` uses these exact names. Empty = system font. */
export const FONT_OPTIONS: FontOption[] = [
  { label: "System default", value: "" },
  { label: "Inter", value: "Inter" },
  { label: "Poppins", value: "Poppins" },
  { label: "Roboto", value: "Roboto" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "Nunito", value: "Nunito" },
  { label: "Work Sans", value: "Work Sans" },
  { label: "Rubik", value: "Rubik" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Mulish", value: "Mulish" },
];

const SYSTEM_STACK = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** CSS font-family value for a chosen Google family (with system fallbacks). */
export function fontStack(family: string): string {
  return family ? `'${family}', ${SYSTEM_STACK}` : SYSTEM_STACK;
}

/** Google Fonts stylesheet href for a family, or null for the system default. */
export function googleFontHref(family: string): string | null {
  if (!family) {
    return null;
  }
  const spec = family.trim().replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${spec}:wght@400;500;600;700;800&display=swap`;
}

/** Inject / replace / remove the Google Fonts <link id="brand-font"> (web only). */
export function loadBrandFont(family: string): void {
  if (typeof document === "undefined") {
    return;
  }
  const href = googleFontHref(family);
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
}
