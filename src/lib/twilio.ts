import { env } from "../config/env.js";
import { ApiError } from "../middleware/errors.js";

/**
 * True once Twilio credentials + a sender are configured. The sender is either a
 * Twilio phone number (TWILIO_FROM) or a Messaging Service (TWILIO_MESSAGING_SERVICE_SID).
 *
 * IMPORTANT: TWILIO_FROM must be a number you OWN inside Twilio (e.g. your Twilio
 * trial number). A personal mobile number cannot be used as a sender — Twilio
 * rejects it with error 21606.
 */
export const twilioConfigured = Boolean(
  env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    (env.TWILIO_FROM || env.TWILIO_MESSAGING_SERVICE_SID),
);

/**
 * Sends an SMS via the Twilio REST API. Uses the Messaging Service if set,
 * otherwise the plain From number. Surfaces Twilio's own error message + code
 * so delivery/config problems (21606 bad From, 21608 unverified recipient on
 * trial, 30034 DLT filtering, …) are visible to the caller.
 */
export async function sendSms(to: string, body: string): Promise<string> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("Body", body);
  if (env.TWILIO_MESSAGING_SERVICE_SID) {
    form.set("MessagingServiceSid", env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    form.set("From", env.TWILIO_FROM);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    sid?: string;
    message?: string;
    code?: number;
  };

  if (!res.ok) {
    const detail = payload.message ?? `Twilio request failed (HTTP ${res.status})`;
    const code = payload.code ? ` [Twilio ${payload.code}]` : "";
    throw new ApiError(502, `${detail}${code}`);
  }

  return payload.sid ?? "";
}
