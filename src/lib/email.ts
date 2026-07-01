import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * Transactional email via SMTP (Nodemailer). Works with any SMTP provider —
 * Gmail app password, MSG91 SMTP, Brevo, etc. When SMTP isn't configured it
 * runs in "mock" mode and logs the email to the console, so the signup flow
 * works in development without a provider.
 */
export const emailConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!emailConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`📧 [mock email] To: ${to}\n   Subject: ${subject}\n   ${text}\n`);
    return;
  }
  await t.sendMail({ from: env.SMTP_FROM || env.SMTP_USER, to, subject, html, text });
}

/** Sends the CONROY welcome email to a newly signed-up shopper. */
export async function sendWelcomeEmail(to: string): Promise<void> {
  const subject = "Welcome to CONROY 👖";
  const text =
    "Welcome to CONROY!\n\nThanks for creating your account. Explore premium denim made to last — " +
    "soft comfort, bold looks.\n\nShop the collection: https://conroy.global/collections/all\n\n— The CONROY team";
  const html = `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h1 style="font-size:24px;letter-spacing:.1em;margin:0 0 4px">CONROY</h1>
    <p style="color:#767676;margin:0 0 24px">Soft comfort · bold looks</p>
    <h2 style="font-size:20px;margin:0 0 12px">Welcome to CONROY 👋</h2>
    <p style="line-height:1.6;color:#2e2e2e">
      Thanks for creating your account. You're all set to shop premium denim made to last.
    </p>
    <p style="margin:28px 0">
      <a href="https://conroy.global/collections/all"
         style="background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-size:14px">
        Shop the collection
      </a>
    </p>
    <p style="color:#767676;font-size:13px">You're receiving this because you signed up at CONROY.</p>
  </div>`;
  await sendEmail({ to, subject, html, text });
}
