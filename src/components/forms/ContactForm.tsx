"use client";

import { useForm, type FieldErrors } from "react-hook-form";
import { useState } from "react";
import type { ContactFormValues } from "@/types";
import { submitContactForm } from "@/services/contact";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/Toast";

const fieldClass =
  "h-12 w-full rounded-md border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/60 transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone";

// CONROY support line — enquiries open a pre-filled WhatsApp chat to this number.
const CONTACT_WHATSAPP_NUMBER = "919998009904";

/** Builds a wa.me click-to-chat URL with the enquiry pre-filled. */
function whatsappUrl(values: ContactFormValues): string {
  const lines = [
    "New enquiry from the CONROY website",
    "",
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    values.phone ? `Phone: ${values.phone}` : "",
    `Subject: ${values.subject}`,
    "",
    values.message,
  ].filter(Boolean);
  return `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>();
  const { toast } = useToast();
  const [done, setDone] = useState<string | null>(null);

  async function onValid(values: ContactFormValues) {
    // Open WhatsApp synchronously inside the click gesture so it isn't popup-blocked.
    // This delivers the enquiry straight to the CONROY support number.
    window.open(whatsappUrl(values), "_blank", "noopener,noreferrer");

    // Persist the enquiry too, so it always lands in the admin inbox.
    const res = await submitContactForm(values);
    if (res.ok) {
      setDone("Your enquiry has been sent to us on WhatsApp. We'll reply shortly.");
      reset();
      toast("Opening WhatsApp — tap send to reach us.", "success");
    } else {
      toast(res.message || "Something went wrong. Please try again.", "error");
    }
  }

  function onInvalid(errs: FieldErrors<ContactFormValues>) {
    const first = Object.values(errs)[0];
    toast(first?.message ? String(first.message) : "Please fix the highlighted fields.", "error");
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-media border border-line bg-white p-8 shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-cream">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h3 className="font-display text-2xl text-ink">Message sent</h3>
        <p className="text-sm text-ink-soft">{done}</p>
        <Button variant="outline" onClick={() => setDone(null)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onValid, onInvalid)}
      className="space-y-5 rounded-media border border-line bg-white p-6 shadow-sm sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            {...register("name", { required: "Please enter your name" })}
            placeholder="Your name"
            className={cn(fieldClass, errors.name && "border-accent")}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="mt-1.5 text-xs text-accent">{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input
            type="email"
            {...register("email", {
              required: "Please enter your email",
              pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Enter a valid email" },
            })}
            placeholder="you@example.com"
            className={cn(fieldClass, errors.email && "border-accent")}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="mt-1.5 text-xs text-accent">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Phone</label>
          <input {...register("phone")} placeholder="Optional" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Subject *</label>
          <input
            {...register("subject", { required: "Please add a subject" })}
            placeholder="How can we help?"
            className={cn(fieldClass, errors.subject && "border-accent")}
            aria-invalid={!!errors.subject}
          />
          {errors.subject && <p className="mt-1.5 text-xs text-accent">{errors.subject.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Message *</label>
        <textarea
          {...register("message", {
            required: "Please write a message",
            minLength: { value: 10, message: "A little more detail, please" },
          })}
          placeholder="Tell us a bit more…"
          rows={5}
          className={cn(
            "w-full resize-none rounded-md border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-stone/60 transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10",
            errors.message && "border-accent",
          )}
          aria-invalid={!!errors.message}
        />
        {errors.message && <p className="mt-1.5 text-xs text-accent">{errors.message.message}</p>}
      </div>

      <div className="space-y-2">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send message"}
        </Button>
        <p className="text-xs text-stone">
          Opens WhatsApp to send your enquiry to <span className="text-ink">+91 99980 09904</span>.
        </p>
      </div>
    </form>
  );
}
