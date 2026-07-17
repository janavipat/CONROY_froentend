"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { submitChatMessage, CHAT_CONFIRMATION } from "@/services/chat";
import { ChatIcon, CloseIcon, SendIcon, CheckIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

/**
 * Storefront chat bubble. Sits bottom-right, opens a small chat window where a
 * visitor can send a message (name/email optional). On submit the message is
 * stored via POST /chat and a static confirmation replaces the form.
 *
 * Mounted in StoreChrome, so it never appears on /admin.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // Focus the message box when the window opens (unless we're showing the
  // confirmation), and close on Escape.
  useEffect(() => {
    if (!open) return;
    if (!sent) messageRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, sent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError("");
    try {
      await submitChatMessage({ name, email, message: trimmed });
      setSent(true);
      setMessage("");
    } catch {
      setError("Sorry — we couldn't send that. Please try again.");
    } finally {
      setSending(false);
    }
  }

  /** Reset back to the form so the visitor can send another message. */
  function startNewMessage() {
    setSent(false);
    setError("");
  }

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Chat with CONROY"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "fixed z-[90] flex flex-col overflow-hidden rounded-media border border-line bg-white shadow-2xl",
              // Mobile: nearly full width above the bubble. Desktop: fixed panel.
              "bottom-24 right-4 left-4 max-h-[70vh] sm:left-auto sm:right-6 sm:w-[22rem]",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-ink px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
                  <ChatIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium leading-tight">Chat with us</p>
                  <p className="text-[0.7rem] leading-tight text-white/70">
                    We usually reply within a day
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 py-6 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-green-600 text-white">
                    <CheckIcon className="h-5 w-5" />
                  </span>
                  <p className="text-sm text-ink">{CHAT_CONFIRMATION}</p>
                  <button
                    type="button"
                    onClick={startNewMessage}
                    className="mt-1 rounded-pill border border-line px-4 py-2 text-xs text-ink transition-colors hover:bg-mist"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Greeting, styled like an incoming bubble */}
                  <div className="mb-4 max-w-[85%] rounded-media rounded-tl-none bg-mist px-3 py-2.5">
                    <p className="text-sm text-ink-soft">
                      Hi! Ask us anything about sizing, orders or delivery — leave your details and
                      we&apos;ll get back to you.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name (optional)"
                        aria-label="Your name (optional)"
                        className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email (optional)"
                        aria-label="Your email (optional)"
                        className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none"
                      />
                    </div>

                    <textarea
                      ref={messageRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      required
                      maxLength={5000}
                      placeholder="Type your message…"
                      aria-label="Your message"
                      className="w-full resize-none rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none"
                    />

                    {error && <p className="text-xs text-accent">{error}</p>}

                    <button
                      type="submit"
                      disabled={!message.trim() || sending}
                      className="flex w-full items-center justify-center gap-2 rounded-pill bg-ink py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sending ? (
                        "Sending…"
                      ) : (
                        <>
                          Send message
                          <SendIcon className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-4 z-[90] grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-lg transition-colors hover:bg-accent sm:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "chat"}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </>
  );
}
