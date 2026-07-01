import { api } from "./api";

export interface AuthUser {
  id: string;
  phone: string;
}

export interface StartResult {
  ok: boolean;
  message: string;
  mock?: boolean;
  /** Present in mock mode — the code to enter. */
  code?: string;
}

export interface VerifyResult {
  ok: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

function errMsg(err: unknown, fallback: string): string {
  const m = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return typeof m === "string" ? m : fallback;
}

/** Requests an OTP (sent by MSG91, or mocked in dev) to the phone number. */
export async function startPhoneOtp(phoneE164: string): Promise<StartResult> {
  try {
    const { data } = await api.post("/auth/phone/start", { phone: phoneE164 });
    return { ok: true, message: data.message, mock: data.mock, code: data.code };
  } catch (err) {
    return { ok: false, message: errMsg(err, "Couldn't send the code. Please try again.") };
  }
}

/** Verifies the OTP; on success returns the user + session token. */
export async function verifyPhoneOtp(
  phoneE164: string,
  code: string,
  email?: string,
): Promise<VerifyResult> {
  try {
    const { data } = await api.post("/auth/phone/verify", { phone: phoneE164, code, email });
    return {
      ok: true,
      message: data.message,
      user: data.data?.user,
      token: data.data?.session?.access_token,
    };
  } catch (err) {
    return { ok: false, message: errMsg(err, "Incorrect or expired code.") };
  }
}
