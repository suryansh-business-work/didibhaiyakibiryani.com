export interface IntegrationData {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  mailFrom: string;
  mailFromName: string;
  smtpPassSet: boolean;
  smtpConfigured: boolean;
  imagekitUrlEndpoint: string;
  imagekitPublicKey: string;
  imagekitPrivateKeySet: boolean;
  imagekitConfigured: boolean;
}

export interface IntegrationForm {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
  mailFromName: string;
  imagekitUrlEndpoint: string;
  imagekitPublicKey: string;
  imagekitPrivateKey: string;
}

export const BLANK_INTEGRATION: IntegrationForm = {
  smtpHost: "",
  smtpPort: "",
  smtpUser: "",
  smtpPass: "",
  mailFrom: "",
  mailFromName: "",
  imagekitUrlEndpoint: "",
  imagekitPublicKey: "",
  imagekitPrivateKey: "",
};

/** Copy a query result into editable form state (secrets always start blank). */
export function toIntegrationForm(d: IntegrationData): IntegrationForm {
  return {
    smtpHost: d.smtpHost,
    smtpPort: d.smtpPort,
    smtpUser: d.smtpUser,
    smtpPass: "",
    mailFrom: d.mailFrom,
    mailFromName: d.mailFromName,
    imagekitUrlEndpoint: d.imagekitUrlEndpoint,
    imagekitPublicKey: d.imagekitPublicKey,
    imagekitPrivateKey: "",
  };
}
