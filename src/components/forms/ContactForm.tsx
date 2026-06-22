"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import type { ContactFormValues } from "@/types";
import { submitContactForm } from "@/services/contact";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";

const fieldClass =
  "h-12 w-full border-b border-line bg-transparent text-sm text-ink placeholder:text-stone/70 focus:border-ink focus:outline-none transition-colors";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>();
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(values: ContactFormValues) {
    const res = await submitContactForm(values);
    if (res.ok) {
      setDone(res.message);
      reset();
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-4 border border-line bg-paper p-8">
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
      <div className="grid gap-7 sm:grid-cols-2">
        <div>
          <input
            {...register("name", { required: "Please enter your name" })}
            placeholder="Name *"
            className={cn(fieldClass, errors.name && "border-accent")}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="mt-1.5 text-xs text-accent">{errors.name.message}</p>}
        </div>
        <div>
          <input
            type="email"
            {...register("email", {
              required: "Please enter your email",
              pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Enter a valid email" },
            })}
            placeholder="Email *"
            className={cn(fieldClass, errors.email && "border-accent")}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="mt-1.5 text-xs text-accent">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <input {...register("phone")} placeholder="Phone (optional)" className={fieldClass} />
        <input
          {...register("subject", { required: "Please add a subject" })}
          placeholder="Subject *"
          className={cn(fieldClass, errors.subject && "border-accent")}
          aria-invalid={!!errors.subject}
        />
      </div>
      {errors.subject && <p className="-mt-4 text-xs text-accent">{errors.subject.message}</p>}

      <div>
        <textarea
          {...register("message", {
            required: "Please write a message",
            minLength: { value: 10, message: "A little more detail, please" },
          })}
          placeholder="How can we help? *"
          rows={5}
          className={cn(
            "w-full resize-none border-b border-line bg-transparent py-3 text-sm text-ink placeholder:text-stone/70 focus:border-ink focus:outline-none",
            errors.message && "border-accent",
          )}
          aria-invalid={!!errors.message}
        />
        {errors.message && <p className="mt-1.5 text-xs text-accent">{errors.message.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
