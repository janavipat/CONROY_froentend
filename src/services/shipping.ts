import { api } from "./api";

export interface Serviceability {
  /** False when the courier could not be asked — treat as "unknown", not "no". */
  checked: boolean;
  pincode: string;
  serviceable: boolean;
  codAvailable?: boolean;
  prepaidAvailable?: boolean;
  city?: string;
  state?: string;
}

/**
 * Whether the courier delivers to a pincode.
 *
 * Fails OPEN on any error: a checkout that refuses every order because the
 * courier's API is briefly unreachable loses far more than the occasional
 * undeliverable address does. `checked: false` says "we could not ask", and
 * callers must not present that to the shopper as a refusal.
 */
export async function checkServiceability(pincode: string): Promise<Serviceability> {
  try {
    const { data } = await api.get("/shipping/serviceability", { params: { pincode } });
    return data as Serviceability;
  } catch {
    return { checked: false, pincode, serviceable: true };
  }
}
