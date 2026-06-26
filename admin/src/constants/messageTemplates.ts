/**
 * Customer-message templates the admin can generate per order and configure
 * under "Generate Messages". Each kind shares the common {{tokens}} plus one
 * link token unique to that message (tracking / survey / receipt link).
 */
export type MessageKind = "tracking" | "survey" | "receipt";

export interface MessagePlaceholder {
  token: string;
  desc: string;
}

export type MessageSettingsKey =
  | "trackingMessageTemplate"
  | "surveyMessageTemplate"
  | "receiptMessageTemplate";

export interface MessageTemplateConfig {
  kind: MessageKind;
  /** Sidebar / dialog label, e.g. "Tracking Message". */
  label: string;
  /** Settings field that stores this template. */
  settingsKey: MessageSettingsKey;
  /** The per-order link token unique to this kind. */
  linkToken: string;
  /** Description shown on the link-token chip. */
  linkDesc: string;
  /** Default message used when no template has been saved yet. */
  defaultTemplate: string;
}

export interface MessageVars {
  name: string;
  /** The relevant per-order link for this message kind. */
  link: string;
  orderNumber: string;
  brandName: string;
  website: string;
}

const TRACKING_DEFAULT = `Hi {{name}},

Good news — your order {{orderNumber}} from {{brandName}} is packed and on its way! 🛵💨

Your freshly-made biryani is headed to your doorstep. Follow your delivery partner live and check the estimated arrival time here:

{{trackingLink}}

Please keep your phone handy so our rider can reach you on arrival. Thank you for your patience!

Warm regards,
Team {{brandName}} 🍛
{{website}}`;

const SURVEY_DEFAULT = `Hi {{name}},

We hope every bite of your order {{orderNumber}} from {{brandName}} was delicious! 🍛

Your opinion means the world to us. Could you spare a minute to rate your experience and tell us how we did?

{{surveyLink}}

Your honest feedback helps us cook better, deliver faster, and serve you the biryani you love. If anything wasn't perfect, please let us know — we'll make it right.

Thank you for choosing us. We can't wait to serve you again!

Warm regards,
Team {{brandName}} 🍛🙏
{{website}}`;

const RECEIPT_DEFAULT = `Hi {{name}},

Thank you for ordering from {{brandName}} — we truly appreciate your trust! 🙏

Here is the receipt for your order {{orderNumber}}, with the full bill breakdown for your records:

{{receiptLink}}

Need a GST invoice or have a question about your bill? Just reply to this message and we'll be happy to help.

Enjoy your meal, and see you again soon!

Warm regards,
Team {{brandName}} 🍛
{{website}}`;

/** All message kinds, in the order they appear in the menu / sidebar. */
export const MESSAGE_CONFIGS: ReadonlyArray<MessageTemplateConfig> = [
  {
    kind: "tracking",
    label: "Tracking Message",
    settingsKey: "trackingMessageTemplate",
    linkToken: "{{trackingLink}}",
    linkDesc: "Per-order live tracking link",
    defaultTemplate: TRACKING_DEFAULT,
  },
  {
    kind: "survey",
    label: "Survey Message",
    settingsKey: "surveyMessageTemplate",
    linkToken: "{{surveyLink}}",
    linkDesc: "Per-order feedback survey link",
    defaultTemplate: SURVEY_DEFAULT,
  },
  {
    kind: "receipt",
    label: "Receipt Message",
    settingsKey: "receiptMessageTemplate",
    linkToken: "{{receiptLink}}",
    linkDesc: "Per-order receipt link",
    defaultTemplate: RECEIPT_DEFAULT,
  },
];

/** Look up a message config by kind (always present for a valid kind). */
export function messageConfig(kind: MessageKind): MessageTemplateConfig {
  return MESSAGE_CONFIGS.find((c) => c.kind === kind) ?? MESSAGE_CONFIGS[0];
}

/** Placeholders this kind understands: the shared tokens + its own link token. */
export function placeholdersFor(cfg: MessageTemplateConfig): MessagePlaceholder[] {
  return [
    { token: "{{name}}", desc: "Customer name" },
    { token: cfg.linkToken, desc: cfg.linkDesc },
    { token: "{{orderNumber}}", desc: "Receipt / order no." },
    { token: "{{brandName}}", desc: "Brand name (from Branding)" },
    { token: "{{website}}", desc: "Website (from Branding)" },
  ];
}

/** Replace every {{token}} in the template with its dynamic value. */
export function fillMessageTemplate(
  template: string,
  cfg: MessageTemplateConfig,
  vars: MessageVars
): string {
  return template
    .replaceAll("{{name}}", vars.name)
    .replaceAll(cfg.linkToken, vars.link)
    .replaceAll("{{orderNumber}}", vars.orderNumber)
    .replaceAll("{{brandName}}", vars.brandName)
    .replaceAll("{{website}}", vars.website);
}
