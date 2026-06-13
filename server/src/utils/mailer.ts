import mongoose from "mongoose";
import nodemailer from "nodemailer";
import mjml2html from "mjml";
import { logger } from "./logger.js";
import { getOrCreateSettings } from "../models/Settings.js";
import type { ISettings } from "../models/Settings.js";

/** Read the settings doc only when Mongo is connected; otherwise env-only. */
async function settingsOrNull(): Promise<ISettings | null> {
  if (mongoose.connection.readyState !== 1) return null;
  try {
    return await getOrCreateSettings();
  } catch {
    return null;
  }
}

export interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromAddr: string;
  fromName: string;
}

/**
 * Resolve SMTP credentials: admin-entered values (Settings doc) win, with the
 * server environment as a fallback. Keeps secrets out of source — they live in
 * the DB or the host env, never the repo.
 */
export async function resolveMailConfig(): Promise<MailConfig | null> {
  const s = await settingsOrNull();
  const host = s?.smtpHost || process.env.SMTP_HOST || "";
  const user = s?.smtpUser || process.env.SMTP_USER || "";
  const pass = s?.smtpPass || process.env.SMTP_PASS || "";
  if (!host || !user || !pass) return null;
  const port = Number(s?.smtpPort || process.env.SMTP_PORT) || 587;
  const fromName = s?.mailFromName || process.env.MAIL_FROM_NAME || "Didi Bhaiya ki Biryani";
  const fromAddr = s?.mailFrom || process.env.MAIL_FROM || user;
  return { host, port, user, pass, fromAddr, fromName };
}

export async function mailConfigured(): Promise<boolean> {
  return (await resolveMailConfig()) !== null;
}

function transportFor(cfg: MailConfig): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
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

/** Verify the SMTP login (used by the platform health report). */
export async function verifySmtp(): Promise<void> {
  const cfg = await resolveMailConfig();
  if (!cfg) throw new Error("SMTP is not configured.");
  await transportFor(cfg).verify();
}

/** Compile MJML → HTML and send. Returns false when SMTP isn't configured. */
export async function sendMail(job: MailJob): Promise<boolean> {
  const cfg = await resolveMailConfig();
  if (!cfg) {
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
  await transportFor(cfg).sendMail({
    from: `"${cfg.fromName}" <${cfg.fromAddr}>`,
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
