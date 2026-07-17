import { api } from "./api";

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

/** Fetches a customer's saved delivery addresses. */
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

/** Replaces a customer's saved address list. */
export async function saveAddresses(phone: string, addresses: Address[]): Promise<Address[]> {
  const { data } = await api.put<{ ok: boolean; data: Address[] }>("/addresses", {
    phone,
    addresses,
  });
  return data.data ?? addresses;
}

/** Formats an address into a single line (for summaries / checkout). */
export function formatAddress(a: Address): string {
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(", ");
}
