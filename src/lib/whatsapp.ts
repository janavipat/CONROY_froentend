import { env } from "../config/env.js";
import { ApiError } from "../middleware/errors.js";

/**
 * True once the WhatsApp Cloud API is configured: an access token, the sender's
 * phone-number ID, and the name of an approved template.
 *
 * OTP is sent from YOUR WhatsApp Business number (no SMS, so no India DLT is
 * required). Free for up to 1,000 conversations/month on Meta's Cloud API.
 */
export const whatsappConfigured = Boolean(
  env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_TEMPLATE_NAME,
);

const GRAPH_VERSION = "v21.0";

/** Network attempts before giving up (Graph API occasionally resets TLS). */
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 15_000;

/**
 * POSTs JSON to the Graph API, retrying transient network failures (DNS/TLS
 * resets, timeouts) with a short backoff. Only connection-level errors are
 * retried — an HTTP response (even 4xx) is returned to the caller as-is, since
 * those are deterministic and retrying would just resend.
 */
async function graphPost(url: string, body: unknown): Promise<Response> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      lastErr = err;
      const code = (err as { cause?: { code?: string } })?.cause?.code ?? (err as Error)?.name;
      console.warn(`WhatsApp send attempt ${attempt}/${MAX_ATTEMPTS} failed: ${code}`);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }

  const cause = (lastErr as { cause?: { code?: string } })?.cause?.code ?? "network error";
  throw new ApiError(
    503,
    `Couldn't reach WhatsApp right now (${cause}). Please try again in a moment.`,
  );
}

/**
 * Sends an OTP through a WhatsApp "authentication" template. The code is passed
 * to the template body and (unless disabled) to its copy-code button — the
 * structure Meta requires for authentication-category templates.
 *
 * @param toE164 recipient in E.164 (e.g. +919876543210)
 * @param code   the one-time code
 * @returns the WhatsApp message id
 */
export async function sendWhatsappOtp(toE164: string, code: string): Promise<string> {
  // WhatsApp expects digits only, without the leading '+'.
  const to = toE164.replace(/^\+/, "");
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const components: Array<Record<string, unknown>> = [
    { type: "body", parameters: [{ type: "text", text: code }] },
  ];

  // Authentication templates include a copy-code / one-tap button that also
  // receives the code. Disable with WHATSAPP_OTP_BUTTON=false if your template
  // has no button (a plain utility template).
  if (env.WHATSAPP_OTP_BUTTON !== "false") {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: code }],
    });
  }

  const res = await graphPost(url, {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: env.WHATSAPP_TEMPLATE_NAME,
      language: { code: env.WHATSAPP_TEMPLATE_LANG },
      components,
    },
  });

  const payload = (await res.json().catch(() => ({}))) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; code?: number; error_data?: { details?: string } };
  };

  if (!res.ok) {
    const detail =
      payload.error?.error_data?.details ??
      payload.error?.message ??
      `WhatsApp request failed (HTTP ${res.status})`;
    const code2 = payload.error?.code ? ` [WA ${payload.error.code}]` : "";
    throw new ApiError(502, `${detail}${code2}`);
  }

  return payload.messages?.[0]?.id ?? "";
}
