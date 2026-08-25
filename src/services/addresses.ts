import { api } from "./api";

export const ADDRESS_LABELS = ["Home", "Work", "Other"] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  label: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** The delivery fields a customer fills in; the server owns id and timestamps. */
export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  label?: AddressLabel;
  isDefault?: boolean;
}

/** Surfaces the server's own message rather than a generic failure. */
function asError(err: unknown, fallback: string): Error {
  const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return new Error(message || fallback);
}

/**
 * A customer's saved delivery addresses, default first.
 *
 * Returns an empty list rather than throwing: checkout must still work when the
 * address book is unreachable, falling back to the blank form.
 */
export async function fetchAddresses(phone: string): Promise<Address[]> {
  try {
    const { data } = await api.get<{ ok: boolean; data: Address[] }>("/addresses", {
      params: { phone },
    });
    return data.data ?? [];
  } catch {
    return [];
  }
}

/** Adds one address to the book. The customer's first becomes their default. */
export async function createAddress(customerPhone: string, input: AddressInput): Promise<Address> {
  try {
    const { data } = await api.post<{ data: Address }>("/addresses", { customerPhone, ...input });
    return data.data;
  } catch (err) {
    throw asError(err, "Could not save this address.");
  }
}

/** Edits an address in place — never creates a second copy of it. */
export async function updateAddress(
  customerPhone: string,
  id: string,
  input: Partial<AddressInput>,
): Promise<Address> {
  try {
    const { data } = await api.patch<{ data: Address }>(`/addresses/${id}`, {
      customerPhone,
      ...input,
    });
    return data.data;
  } catch (err) {
    throw asError(err, "Could not update this address.");
  }
}

/** Makes one address the customer's only default. Returns the updated book. */
export async function setDefaultAddress(customerPhone: string, id: string): Promise<Address[]> {
  try {
    const { data } = await api.post<{ data: Address[] }>(`/addresses/${id}/default`, {
      customerPhone,
    });
    return data.data ?? [];
  } catch (err) {
    throw asError(err, "Could not change the default address.");
  }
}

/**
 * Removes an address. If it was the default, the server promotes another, so
 * the returned book always has a default while any address remains.
 */
export async function deleteAddress(customerPhone: string, id: string): Promise<Address[]> {
  try {
    const { data } = await api.delete<{ data: Address[] }>(`/addresses/${id}`, {
      params: { phone: customerPhone },
    });
    return data.data ?? [];
  } catch (err) {
    throw asError(err, "Could not delete this address.");
  }
}

/** Formats an address into a single line (for summaries / checkout). */
export function formatAddress(a: Address): string {
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(", ");
}
