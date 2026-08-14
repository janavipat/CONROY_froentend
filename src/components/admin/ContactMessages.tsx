"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adminListContacts,
  adminSetContactHandled,
  adminDeleteContact,
  type AdminContact,
} from "@/services/admin";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import {
  HeadsetIcon,
  MailIcon,
  PhoneIcon,
  CheckIcon,
  CloseIcon,
  SearchIcon,
} from "@/components/ui/Icons";
import { ConfirmDialog } from "./ui";
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

/** Normalises an Indian phone number for a wa.me link (E.164 digits, no +). */
function waNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

type FilterKey = "all" | "new" | "handled";

export function ContactMessages() {
  const [rows, setRows] = useState<AdminContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [pendingDelete, setPendingDelete] = useState<AdminContact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const data = await adminListContacts();
        if (active) setRows(data);
      } catch {
        if (active) setError("Could not load messages. Start the backend and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  const newCount = rows.filter((r) => !r.handled).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q);
      const matchesF = filter === "all" || (filter === "new" ? !r.handled : !!r.handled);
      return matchesQ && matchesF;
    });
  }, [rows, query, filter]);

  async function toggleHandled(c: AdminContact) {
    const next = !c.handled;
    setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, handled: next } : r)));
    try {
      await adminSetContactHandled(c.id, next);
      toast(next ? "Marked as handled." : "Reopened.", "success");
    } catch {
      setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, handled: !next } : r)));
      toast("Couldn't update — run the latest DB migration.", "error");
    }
  }

  async function remove(c: AdminContact) {
    setDeleting(true);
    const prev = rows;
    setRows((rs) => rs.filter((r) => r.id !== c.id));
    try {
      await adminDeleteContact(c.id);
      toast("Enquiry deleted.", "success");
    } catch {
      setRows(prev);
      toast("Couldn't delete. Try again.", "error");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  const counts: Record<FilterKey, number> = {
    all: rows.length,
    new: newCount,
    handled: rows.length - newCount,
  };
  const tabs: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "handled", label: "Handled" },
  ];

  return (
    <div className="mx-auto min-w-0 max-w-[1360px]">
      <div className="min-w-0">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Contact messages</h1>
        <p className="mt-1 text-sm text-stone">
          {loading
            ? "Loading…"
            : `${rows.length} enquir${rows.length === 1 ? "y" : "ies"} · ${newCount} new`}
        </p>
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {/* Toolbar — tabs and search on one strip, same as the Returns page. */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3 lg:flex-row lg:items-center">
        <div className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 pb-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors",
                filter === t.key
                  ? "bg-[#171717] text-white"
                  : "text-[#737373] hover:bg-[#F5F5F4] hover:text-[#171717]",
              )}
            >
              {t.label}{" "}
              <span className={cn("tabular-nums", filter === t.key ? "opacity-70" : "text-[#A3A3A3]")}>
                ({counts[t.key]})
              </span>
            </button>
          ))}
        </div>

        <div className="flex min-w-0 items-center gap-2 rounded-md border border-line px-3 lg:w-72 lg:shrink-0">
          <SearchIcon className="h-4 w-4 shrink-0 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, subject…"
            aria-label="Search messages"
            className="h-9 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-stone"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-4 grid place-items-center rounded-xl border border-[#E5E5E5] bg-white py-14">
          <Loader size="sm" label="" />
        </div>
      ) : filtered.length === 0 ? (
        /* Was a py-16 band; the icon still carries it at two-thirds the height. */
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white py-10 text-center">
          <HeadsetIcon className="h-7 w-7 text-[#D4D4D4]" />
          <p className="text-sm text-ink">
            {rows.length === 0 ? "No messages yet" : "No messages match your filters"}
          </p>
          {rows.length > 0 && (
            <p className="text-[0.8125rem] text-stone">Try another tab or clear the search.</p>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)]"
              >
                {/* Subject, sender and the message share one padded block —
                    they used to sit in three separate bordered bands, which
                    made a one-line enquiry 178px tall. */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="min-w-0 truncate font-medium text-ink" title={c.subject}>
                          {c.subject}
                        </h3>
                        {!c.handled && (
                          <span className="shrink-0 rounded-md bg-[#171717] px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.06em] text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[0.75rem] text-[#737373]">
                        <span className="text-ink-soft">{c.name}</span> · {formatDate(c.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => toggleHandled(c)}
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                          c.handled
                            ? "border border-line text-[#737373] hover:border-ink hover:text-ink"
                            : "bg-ink text-white hover:opacity-90",
                        )}
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        {c.handled ? "Handled" : "Mark handled"}
                      </button>
                      <button
                        onClick={() => setPendingDelete(c)}
                        aria-label={`Delete enquiry from ${c.name}`}
                        title="Delete enquiry"
                        className="grid h-8 w-8 place-items-center rounded-md text-[#A3A3A3] transition-colors hover:bg-[#DC2626]/5 hover:text-[#DC2626]"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 whitespace-pre-line text-[0.8125rem] leading-relaxed text-ink-soft">
                    {c.message}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#F0F0EE] bg-[#FAFAF9] px-4 py-2 text-[0.75rem] sm:px-5">
                  <a
                    href={`mailto:${c.email}`}
                    className="inline-flex min-w-0 items-center gap-1.5 text-ink-soft hover:text-ink"
                  >
                    <MailIcon className="h-3.5 w-3.5 shrink-0 text-stone" />
                    <span className="truncate">{c.email}</span>
                  </a>
                  {c.phone && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-ink-soft">
                      <PhoneIcon className="h-3.5 w-3.5 text-stone" />
                      {c.phone}
                    </span>
                  )}
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    {c.phone && (
                      <a
                        href={`https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent(
                          `Hi ${c.name}, thanks for reaching out to CONROY regarding "${c.subject}".`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center rounded-md bg-[#25D366] px-2.5 font-medium text-white transition-opacity hover:opacity-90"
                      >
                        Reply on WhatsApp
                      </a>
                    )}
                    <a
                      href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject}`)}`}
                      className="inline-flex h-7 items-center rounded-md border border-line px-2.5 font-medium text-ink transition-colors hover:border-ink"
                    >
                      Reply by email
                    </a>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* The × used to delete an enquiry on the first click, with nothing asked
          and no undo. */}
      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title="Delete this enquiry?"
        description="The message is removed for good. This can’t be undone."
        detail={
          pendingDelete && (
            <div className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-medium text-[#171717]">
                {pendingDelete.subject}
              </span>
              <span className="block truncate text-[0.75rem] text-[#737373]">
                {pendingDelete.name} · {pendingDelete.email}
              </span>
            </div>
          )
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete)}
      />
    </div>
  );
}
