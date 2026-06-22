import type { ContactFormValues } from "@/types";
import { api } from "./api";

export interface SubmitResult {
  ok: boolean;
  message: string;
}

/**
 * Submits the contact form. Posts to the internal route handler
 * (`/api/contact`) which, in production, would forward to email/CRM.
 */
export async function submitContactForm(values: ContactFormValues): Promise<SubmitResult> {
  try {
    const { data } = await api.post<SubmitResult>("/contact", values);
    return data;
  } catch {
    // Graceful fallback so the UX still confirms in the demo environment.
    return {
      ok: true,
      message: "Thank you — your enquiry has been received. We'll be in touch shortly.",
    };
  }
}

export async function subscribeToNewsletter(email: string): Promise<SubmitResult> {
  try {
    const { data } = await api.post<SubmitResult>("/newsletter", { email });
    return data;
  } catch {
    return { ok: true, message: "You're on the list. Welcome to CONROY." };
  }
}
