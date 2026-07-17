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
import { HeadsetIcon, MailIcon, PhoneIcon, CheckIcon, CloseIcon } from "@/components/ui/Icons";
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
    const prev = rows;
    setRows((rs) => rs.filter((r) => r.id !== c.id));
    try {
      await adminDeleteContact(c.id);
      toast("Enquiry deleted.", "success");
    } catch {
      setRows(prev);
      toast("Couldn't delete. Try again.", "error");
    }
  }

  const tabs: { key: FilterKey; label: string }[] = [
    { key: "all", label: `All (${rows.length})` },
    { key: "new", label: `New (${newCount})` },
    { key: "handled", label: `Handled (${rows.length - newCount})` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Contact messages</h1>
          <p className="mt-1 text-sm text-stone">
            {loading ? "Loading…" : `${rows.length} enquir${rows.length === 1 ? "y" : "ies"} · ${newCount} new`}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-mist p-1 text-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "relative rounded-md px-3 py-1.5 font-medium transition-colors",
                filter === t.key ? "text-ink" : "text-stone hover:text-ink",
              )}
            >
              {filter === t.key && (
                <motion.span
                  layoutId="contactFilterPill"
                  className="absolute inset-0 rounded-md bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <SearchGlyph />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, subject…"
            className="w-64 rounded-md border border-line bg-white py-2 pl-8 pr-3 text-sm text-ink outline-none placeholder:text-stone focus:border-ink"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-16">
          <Loader label="Loading messages" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-media border border-line bg-white py-16 text-center">
          <HeadsetIcon className="h-9 w-9 text-stone" />
          <p className="text-stone">
            {rows.length === 0 ? "No messages yet." : "No messages match your filters."}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          <AnimatePresence initial={false}>
            {filtered.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "overflow-hidden rounded-media border bg-white shadow-sm",
                  c.handled ? "border-line" : "border-ink/25",
                )}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium text-ink">{c.subject}</h3>
                      {!c.handled && (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-stone">
                      From <span className="text-ink-soft">{c.name}</span> · {formatDate(c.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => toggleHandled(c)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        c.handled
                          ? "border-line text-stone hover:border-ink hover:text-ink"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                      )}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      {c.handled ? "Handled" : "Mark handled"}
                    </button>
                    <button
                      onClick={() => remove(c)}
                      aria-label="Delete enquiry"
                      className="grid h-8 w-8 place-items-center rounded-md border border-line text-stone transition-colors hover:border-accent hover:text-accent"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <p className="whitespace-pre-line px-5 py-4 text-sm text-ink-soft">{c.message}</p>

                {/* Contact + actions */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line bg-mist/30 px-5 py-3 text-xs">
                  <a
                    href={`mailto:${c.email}`}
                    className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink"
                  >
                    <MailIcon className="h-4 w-4 text-stone" />
                    {c.email}
                  </a>
                  {c.phone && (
                    <span className="inline-flex items-center gap-1.5 text-ink-soft">
                      <PhoneIcon className="h-4 w-4 text-stone" />
                      {c.phone}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {c.phone && (
                      <a
                        href={`https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent(
                          `Hi ${c.name}, thanks for reaching out to CONROY regarding "${c.subject}".`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-[#25D366] px-3 py-1.5 font-medium text-white transition-opacity hover:opacity-90"
                      >
                        Reply on WhatsApp
                      </a>
                    )}
                    <a
                      href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject}`)}`}
                      className="rounded-md border border-line px-3 py-1.5 font-medium text-ink transition-colors hover:border-ink"
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
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
