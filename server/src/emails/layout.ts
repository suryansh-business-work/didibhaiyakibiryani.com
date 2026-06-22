/**
 * Shared MJML email shell. Branding (name, colors, contact details) comes from
 * the admin-managed Settings document so every email follows the brand.
 */
export interface EmailBrand {
  brandName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  companyName: string;
  companyAddress: string;
  supportEmail: string;
  supportPhone: string;
}

export const DEFAULT_BRAND: EmailBrand = {
  brandName: "Didi Bhaiya ki Biryani",
  tagline: "Har bite, yaad rahe!",
  logoUrl: "",
  primaryColor: "#e4b65c",
  companyName: "D&B Foods",
  companyAddress: "",
  supportEmail: "",
  supportPhone: "",
};

function headerSection(brand: EmailBrand): string {
  const logo = brand.logoUrl
    ? `<mj-image src="${brand.logoUrl}" alt="${brand.brandName}" width="72px" padding-bottom="6px" />`
    : "";
  return `
    <mj-section background-color="#16100b" padding="26px 24px 18px">
      <mj-column>
        ${logo}
        <mj-text align="center" color="${brand.primaryColor}" font-size="13px" padding-bottom="2px">
          ${brand.tagline}
        </mj-text>
        <mj-text align="center" color="#f5ece0" font-size="22px" font-weight="800">
          ${brand.brandName}
        </mj-text>
      </mj-column>
    </mj-section>`;
}

function footerSection(brand: EmailBrand): string {
  const contactBits = [brand.supportPhone, brand.supportEmail].filter(Boolean).join(" · ");
  const contact = contactBits
    ? `<mj-text align="center" color="#8d8073" font-size="12px">${contactBits}</mj-text>`
    : "";
  const address = brand.companyAddress
    ? `<mj-text align="center" color="#6b6157" font-size="11px">${brand.companyAddress}</mj-text>`
    : "";
  return `
    <mj-section background-color="#0e0a07" padding="18px 24px 26px">
      <mj-column>
        ${contact}
        ${address}
        <mj-text align="center" color="#6b6157" font-size="11px">
          © ${new Date().getFullYear()} ${brand.brandName} (${brand.companyName}) · 100% Pure Veg
        </mj-text>
      </mj-column>
    </mj-section>`;
}

/** Wrap body sections in the branded shell. */
export function emailShell(brand: EmailBrand, bodySections: string): string {
  return `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Helvetica, Arial, sans-serif" />
      <mj-text line-height="1.55" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#0b0705">
    ${headerSection(brand)}
    ${bodySections}
    ${footerSection(brand)}
  </mj-body>
</mjml>`;
}

/** A standard content card section. */
export function cardSection(inner: string): string {
  return `
    <mj-section background-color="#1a130d" border-radius="14px" padding="26px 28px">
      <mj-column>
        ${inner}
      </mj-column>
    </mj-section>`;
}

export function ctaButton(brand: EmailBrand, label: string, href: string): string {
  return `<mj-button background-color="${brand.primaryColor}" color="#2a1a06" font-weight="800"
            border-radius="10px" href="${href}" padding-top="14px">${label}</mj-button>`;
}
