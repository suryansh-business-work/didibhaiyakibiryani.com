import nodemailer from "nodemailer";
import mjml2html from "mjml";
import { logger } from "./logger.js";

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface MailJob {
  to: string;
  subject: string;
  mjml: string;
  attachments?: MailAttachment[];
}

/** Compile MJML → HTML and send. Returns false when SMTP isn't configured. */
export async function sendMail(job: MailJob): Promise<boolean> {
  if (!mailConfigured()) {
    logger.warn({ to: job.to, subject: job.subject }, "Email skipped: SMTP not configured");
    return false;
  }
  // mjml v5: mjml2html is async
  const { html, errors } = await mjml2html(job.mjml, { validationLevel: "soft" });
  if (errors.length > 0) {
    logger.warn(
      { subject: job.subject, errors: errors.map((e: { message: string }) => e.message) },
      "MJML warnings"
    );
  }
  const fromName = process.env.MAIL_FROM_NAME || "Didi Bhaiya ki Biryani";
  const fromAddr = process.env.MAIL_FROM || process.env.SMTP_USER;
  await getTransport().sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: job.to,
    subject: job.subject,
    html,
    attachments: job.attachments,
  });
  logger.info({ to: job.to, subject: job.subject }, "Email sent");
  return true;
}

/** Fire-and-forget send for use inside mutations — never blocks or throws. */
export function sendMailAsync(job: MailJob): void {
  sendMail(job).catch((err: unknown) => {
    logger.error(
      { to: job.to, subject: job.subject, err: err instanceof Error ? err.message : String(err) },
      "Email send failed"
    );
  });
}
