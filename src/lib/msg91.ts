import { env } from "../config/env.js";

/**
 * MSG91 OTP API (v5). MSG91 generates, stores and validates the OTP itself —
 * we only trigger a send and ask it to verify. The auth key is secret and must
 * never reach the browser, so all calls happen here on the server.
 * Docs: https://docs.msg91.com/otp
 */
const BASE = "https://control.msg91.com/api/v5/otp";

/** Sends an OTP SMS to `mobile` (country code + number, no '+', e.g. 919998009904). */
export async function msg91SendOtp(mobile: string): Promise<void> {
  const params = new URLSearchParams({
    template_id: env.MSG91_TEMPLATE_ID,
    mobile,
    otp_length: String(env.MSG91_OTP_LENGTH),
    otp_expiry: String(env.MSG91_OTP_EXPIRY_MIN),
  });

  const res = await fetch(`${BASE}?${params.toString()}`, {
    method: "POST",
    headers: { authkey: env.MSG91_AUTH_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const json = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
  if (json?.type !== "success") {
    throw new Error(json?.message || "MSG91: could not send the OTP.");
  }
}

/** Verifies `otp` for `mobile`. Returns true when the code is valid. */
export async function msg91VerifyOtp(mobile: string, otp: string): Promise<boolean> {
  const params = new URLSearchParams({ mobile, otp });
  const res = await fetch(`${BASE}/verify?${params.toString()}`, {
    method: "GET",
    headers: { authkey: env.MSG91_AUTH_KEY },
  });
  const json = (await res.json().catch(() => ({}))) as { type?: string };
  return json?.type === "success";
}
