"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  adminListChatMessages,
  adminSetChatStatus,
  adminDeleteChatMessage,
  CHAT_STATUSES,
  type AdminChatMessage,
  type ChatStatus,
} from "@/services/admin";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { ChatIcon, MailIcon, CloseIcon } from "@/components/ui/Icons";
import { ChatStatusBadge, ConfirmDialog } from "./ui";
import { cn } from "@/utils/cn";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

type Filter = "all" | ChatStatus;
const FILTERS: Filter[] = ["all", ...CHAT_STATUSES];

export function ChatMessages() {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminChatMessage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    adminListChatMessages()
      .then((m) => active && (setMessages(m), setLoading(false)))
      .catch(
        () =>
          active &&
          (setError("Could not load chat messages. (Run chat.sql and start the backend.)"),
          setLoading(false)),
      );
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(
    () => (filter === "all" ? messages : messages.filter((m) => m.status === filter)),
    [messages, filter],
  );

  const newCount = useMemo(() => messages.filter((m) => m.status === "new").length, [messages]);

  /** Per-filter tallies, so the tabs say how much is behind each one. */
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: messages.length, new: 0, read: 0, replied: 0, closed: 0 };
    for (const m of messages) c[m.status] = (c[m.status] ?? 0) + 1;
    return c;
  }, [messages]);

  async function changeStatus(id: string, status: ChatStatus) {
    setBusyId(id);
    const prev = messages;
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));
    try {
      await adminSetChatStatus(id, status);
    } catch {
      setMessages(prev); // roll back
      toast("Could not update the status. Please retry.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    const prev = messages;
    setMessages((ms) => ms.filter((m) => m.id !== id));
    try {
      await adminDeleteChatMessage(id);
      toast("Message deleted.", "success");
    } catch {
      setMessages(prev); // roll back
      toast("Could not delete the message. Please retry.", "error");
    } finally {
      setBusyId(null);
      setPendingDelete(null);
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-[1360px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Chat Messages</h1>
          <p className="mt-1 text-sm text-stone">
            {loading
              ? "Loading…"
              : `${messages.length} message${messages.length === 1 ? "" : "s"}` +
                (newCount ? ` · ${newCount} new` : "")}
          </p>
        </div>

        {/* Status filter — the dark active pill used by Returns and Contacts.
            Still hidden while there is nothing to filter. */}
        {!loading && messages.length > 0 && (
          <div className="-mx-1 flex min-w-0 max-w-full gap-1 overflow-x-auto px-1 pb-0.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-[#171717] text-white"
                    : "text-[#737373] hover:bg-[#F5F5F4] hover:text-[#171717]",
                )}
              >
                {f}{" "}
                <span className={cn("tabular-nums", filter === f ? "opacity-70" : "text-[#A3A3A3]")}>
                  ({counts[f] ?? 0})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-5 grid place-items-center rounded-xl border border-[#E5E5E5] bg-white py-14">
          <Loader size="sm" label="" />
        </div>
      ) : messages.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white py-10 text-center">
          <ChatIcon className="h-7 w-7 text-[#D4D4D4]" />
          <p className="text-sm text-ink">No chat messages yet</p>
          <p className="text-[0.8125rem] text-stone">
            Messages sent from the storefront chat bubble appear here.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white py-10 text-center">
          <ChatIcon className="h-7 w-7 text-[#D4D4D4]" />
          <p className="text-sm text-ink">
            No <span className="capitalize">{filter}</span> messages
          </p>
          <p className="text-[0.8125rem] text-stone">Try another filter.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)]"
              >
                {/* Identity and the message share one padded block. They used to
                    be separated by their own rule, which cost a card 181px to
                    show a three-word message. */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.875rem] font-medium text-ink">
                        {m.name || <span className="text-stone">Anonymous visitor</span>}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.75rem] text-[#737373]">
                        {m.email ? (
                          <a
                            href={`mailto:${m.email}`}
                            className="inline-flex min-w-0 items-center gap-1 hover:text-ink"
                          >
                            <MailIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </a>
                        ) : (
                          <span>No email provided</span>
                        )}
                        <span aria-hidden>·</span>
                        <span className="whitespace-nowrap">{formatDate(m.createdAt)}</span>
                      </p>
                    </div>

                    <ChatStatusBadge status={m.status} />
                  </div>

                  <p className="mt-2.5 whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-ink-soft">
                    {m.message}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-[#F0F0EE] bg-[#FAFAF9] px-4 py-2 sm:px-5">
                  {/* aria-label rather than an sr-only <label>: sr-only is
                      position:absolute, and inside this overflow-hidden card
                      its containing block would be the document, not the card
                      — the same escape that stretched the customers table. */}
                  <select
                    aria-label={`Status for the message from ${m.name || "anonymous visitor"}`}
                    value={m.status}
                    disabled={busyId === m.id}
                    onChange={(e) => changeStatus(m.id, e.target.value as ChatStatus)}
                    className="h-8 rounded-md border border-line bg-white px-2 text-[0.75rem] capitalize text-ink focus:border-ink focus:outline-none disabled:opacity-50"
                  >
                    {CHAT_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>

                  {m.email && (
                    <a
                      href={`mailto:${m.email}`}
                      className="inline-flex h-8 items-center rounded-md border border-line px-2.5 text-[0.75rem] font-medium text-ink transition-colors hover:border-ink"
                    >
                      Reply by email
                    </a>
                  )}

                  <button
                    onClick={() => setPendingDelete(m)}
                    disabled={busyId === m.id}
                    className="ml-auto inline-flex h-8 items-center gap-1 rounded-md px-2 text-[0.75rem] text-[#A3A3A3] transition-colors hover:bg-[#DC2626]/5 hover:text-[#DC2626] disabled:opacity-50"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Delete used to fire on the first click, with nothing asked. */}
      <ConfirmDialog
        open={pendingDelete !== null}
        busy={pendingDelete !== null && busyId === pendingDelete.id}
        title="Delete this message?"
        description="The chat message is removed for good. This can’t be undone."
        detail={
          pendingDelete && (
            <div className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-medium text-[#171717]">
                {pendingDelete.name || "Anonymous visitor"}
              </span>
              <span className="block truncate text-[0.75rem] text-[#737373]">
                {formatDate(pendingDelete.createdAt)} · {pendingDelete.message}
              </span>
            </div>
          )
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete.id)}
      />
    </div>
  );
}
