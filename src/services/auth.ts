import { api } from "./api";

export interface AuthUser {
  id: string;
  phone: string;
}

export interface StartResult {
  ok: boolean;
  message: string;
  phone?: string;
  mock?: boolean;
}

export interface VerifyResult {
  ok: boolean;
  message: string;
  user?: AuthUser;
  accessToken?: string;
}

/** Requests an OTP be sent to the phone number (SMS, or mock in dev). */
export async function startPhoneOtp(phone: string): Promise<StartResult> {
  try {
    const { data } = await api.post("/auth/phone/start", { phone });
    return { ok: true, message: data.message, phone: data.phone, mock: data.mock };
  } catch (err: unknown) {
    return { ok: false, message: errMessage(err, "Couldn't send the code. Try again.") };
  }
}

/** Verifies the OTP; on success returns the user + access token. */
export async function verifyPhoneOtp(phone: string, code: string): Promise<VerifyResult> {
  try {
    const { data } = await api.post("/auth/phone/verify", { phone, code });
    return {
      ok: true,
      message: data.message,
      user: data.data?.user,
      accessToken: data.data?.session?.access_token,
    };
  } catch (err: unknown) {
    return { ok: false, message: errMessage(err, "Invalid or expired code.") };
  }
}

function errMessage(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
  ) {
    return (err as { response: { data: { error: string } } }).response.data.error;
  }
  return fallback;
}
