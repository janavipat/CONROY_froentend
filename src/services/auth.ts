import { api } from "./api";

export interface AuthUser {
  id: string;
  phone: string;
  /** Display name captured at sign-up; null for accounts created before it. */
  name?: string | null;
}

export interface StartResult {
  ok: boolean;
  message: string;
  mock?: boolean;
  /** Present in mock mode — the code to enter. */
  code?: string;
  /** Which channel the code went out on ("email" for now — WhatsApp is paused). */
  channel?: string;
}

export interface VerifyResult {
  ok: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

export interface UpdateNameResult {
  ok: boolean;
  message: string;
  name?: string;
}

function errMsg(err: unknown, fallback: string): string {
  const m = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return typeof m === "string" ? m : fallback;
}

export type AuthMode = "signin" | "signup";

/**
 * Requests an OTP to the phone number. Delivered by email for now (WhatsApp is
 * paused) — `email` is required for signup (there's no account to look an
 * address up from yet); sign-in uses whatever email is already on file.
 */
export async function startPhoneOtp(
  phoneE164: string,
  mode: AuthMode = "signin",
  email?: string,
): Promise<StartResult> {
  try {
    const { data } = await api.post("/auth/phone/start", {
      phone: phoneE164,
      mode,
      email: email || undefined,
    });
    return { ok: true, message: data.message, mock: data.mock, code: data.code, channel: data.channel };
  } catch (err) {
    return { ok: false, message: errMsg(err, "Couldn't send the code. Please try again.") };
  }
}

/** Verifies the OTP; on success returns the user + session token. */
export async function verifyPhoneOtp(
  phoneE164: string,
  code: string,
  opts?: { mode?: AuthMode; email?: string; fullName?: string },
): Promise<VerifyResult> {
  try {
    const { data } = await api.post("/auth/phone/verify", {
      phone: phoneE164,
      code,
      mode: opts?.mode ?? "signin",
      email: opts?.email || undefined,
      fullName: opts?.fullName || undefined,
    });
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

/** Updates the signed-in customer's display name. */
export async function updateAccountName(phoneE164: string, name: string): Promise<UpdateNameResult> {
  try {
    const { data } = await api.patch("/auth/profile", { phone: phoneE164, name });
    return { ok: true, message: data.message, name: data.data?.name };
  } catch (err) {
    return { ok: false, message: errMsg(err, "Couldn't save your name. Please try again.") };
  }
}
