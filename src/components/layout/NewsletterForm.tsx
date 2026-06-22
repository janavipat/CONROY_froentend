"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/services/contact";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/Icons";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("loading");
    const res = await subscribeToNewsletter(email);
    setMessage(res.message);
    setStatus("done");
    setEmail("");
  }

  if (status === "done") {
    return (
      <p className="flex items-center gap-2 text-sm text-ink">
        <CheckIcon className="h-4 w-4" /> {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center border-b border-ink">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-stone focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        aria-label="Subscribe"
        className="grid h-9 w-9 shrink-0 place-items-center text-ink transition-colors hover:text-stone disabled:opacity-50"
      >
        <ArrowRightIcon className="h-5 w-5" />
      </button>
    </form>
  );
}
