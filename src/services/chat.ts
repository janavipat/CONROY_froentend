import { api } from "./api";

export interface ChatSubmitValues {
  /** Optional — the widget is open to anonymous visitors. */
  name?: string;
  /** Optional — the widget is open to anonymous visitors. */
  email?: string;
  message: string;
}

export interface ChatSubmitResult {
  ok: boolean;
  message: string;
}

/** The confirmation shown to the visitor once their message is submitted. */
export const CHAT_CONFIRMATION =
  "Thank you for contacting us. Our team will get back to you shortly.";

/** Submits a message from the storefront chat widget. */
export async function submitChatMessage(values: ChatSubmitValues): Promise<ChatSubmitResult> {
  const { data } = await api.post<ChatSubmitResult>("/chat", {
    name: values.name?.trim() || "",
    email: values.email?.trim() || "",
    message: values.message.trim(),
  });
  return data;
}
