import { api } from "./api";

export type ReturnResolution = "refund" | "replacement";
export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "refunded"
  | "replaced"
  | "completed";

export interface ReturnItem {
  product_handle: string;
  title: string;
  size: string;
  price: number;
  quantity: number;
}

export interface ReturnRecord {
  id: string;
  order_id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  reason: string;
  resolution: ReturnResolution;
  status: ReturnStatus;
  created_at: string;
  items: ReturnItem[];
}

export interface CreateReturnInput {
  orderId: string;
  reason: string;
  resolution: ReturnResolution;
  items: { productHandle: string; size: string; quantity: number }[];
}

export interface CreateReturnResult {
  ok: boolean;
  message: string;
  returnId?: string;
}

/** Submits a return / replacement request for an order. */
export async function createReturn(input: CreateReturnInput): Promise<CreateReturnResult> {
  try {
    const { data } = await api.post<{ ok: boolean; message: string; data?: { id: string } }>(
      "/returns",
      input,
    );
    return { ok: data.ok, message: data.message, returnId: data.data?.id };
  } catch (err) {
    const message =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      "Could not submit your return. Please try again.";
    return { ok: false, message };
  }
}

/** Fetches a customer's return requests (by phone). */
export async function fetchMyReturns(phone: string): Promise<ReturnRecord[]> {
  try {
    const { data } = await api.get<{ ok: boolean; data: ReturnRecord[] }>("/returns", {
      params: { phone },
    });
    return data.data ?? [];
  } catch {
    return [];
  }
}

/** Customer-facing label + colour for a return status. */
export function returnStatusBadge(status: ReturnStatus): { text: string; cls: string } {
  switch (status) {
    case "requested":
      return { text: "Return requested", cls: "bg-amber-500 text-white" };
    case "approved":
      return { text: "Return approved", cls: "bg-blue-600 text-white" };
    case "rejected":
      return { text: "Return rejected", cls: "bg-accent text-white" };
    case "refunded":
      return { text: "Refunded", cls: "bg-green-600 text-white" };
    case "replaced":
      return { text: "Replaced", cls: "bg-green-600 text-white" };
    case "completed":
      return { text: "Return completed", cls: "bg-green-600 text-white" };
    default:
      return { text: status, cls: "bg-mist text-ink-soft" };
  }
}
