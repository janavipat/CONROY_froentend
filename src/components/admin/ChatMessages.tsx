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

function statusCls(status: ChatStatus): string {
  switch (status) {
    case "new":
      return "bg-amber-500 text-white";
    case "read":
      return "bg-blue-600 text-white";
    case "replied":
      return "bg-green-600 text-white";
    default:
      return "bg-mist text-ink-soft"; // closed
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
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Chat Messages</h1>
          <p className="mt-1 text-sm text-stone">
            {loading
              ? "Loading…"
              : `${messages.length} message${messages.length === 1 ? "" : "s"}` +
                (newCount ? ` · ${newCount} new` : "")}
          </p>
        </div>

        {/* Status filter */}
        {!loading && messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-xs capitalize transition-colors",
                  filter === f
                    ? "bg-ink text-white"
                    : "border border-line text-ink-soft hover:bg-mist",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-16">
          <Loader label="Loading messages" />
        </div>
      ) : messages.length === 0 ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-mist text-stone">
            <ChatIcon className="h-6 w-6" />
          </span>
          <p className="mt-3 text-stone">No chat messages yet.</p>
          <p className="text-xs text-stone">
            Messages sent from the storefront chat bubble appear here.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-6 rounded-media border border-line bg-white py-16 text-center text-stone">
          No <span className="capitalize">{filter}</span> messages.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-media border border-line bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {m.name || <span className="text-stone">Anonymous visitor</span>}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone">
                      {m.email ? (
                        <a
                          href={`mailto:${m.email}`}
                          className="inline-flex items-center gap-1 hover:text-ink"
                        >
                          <MailIcon className="h-3.5 w-3.5" />
                          {m.email}
                        </a>
                      ) : (
                        <span>No email provided</span>
                      )}
                      <span aria-hidden>·</span>
                      <span>{formatDate(m.createdAt)}</span>
                    </p>
                  </div>

                  <span
                    className={cn(
                      "rounded-pill px-2.5 py-1 text-[0.65rem] font-medium capitalize",
                      statusCls(m.status),
                    )}
                  >
                    {m.status}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap border-t border-line pt-3 text-sm text-ink-soft">
                  {m.message}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <label className="text-xs text-stone">Status:</label>
                  <select
                    value={m.status}
                    disabled={busyId === m.id}
                    onChange={(e) => changeStatus(m.id, e.target.value as ChatStatus)}
                    className="rounded-md border border-line bg-white px-2 py-1.5 text-sm capitalize text-ink focus:border-ink focus:outline-none disabled:opacity-50"
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
                      className="rounded-pill border border-line px-3 py-1.5 text-xs text-ink transition-colors hover:bg-mist"
                    >
                      Reply by email
                    </a>
                  )}

                  <button
                    onClick={() => remove(m.id)}
                    disabled={busyId === m.id}
                    className="ml-auto inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-xs text-stone transition-colors hover:text-accent disabled:opacity-50"
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
    </div>
  );
}
