"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminGetNotifications,
  adminMarkNotificationsRead,
  type AdminNotification,
} from "@/services/admin";
import {
  BagIcon,
  BellIcon,
  BoxIcon,
  ChatIcon,
  EyeIcon,
  LayersIcon,
  MailIcon,
  ReturnIcon,
  TruckIcon,
  UserIcon,
} from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

/** How often the feed is re-fetched. The endpoint is a cheap read. */
const POLL_MS = 20_000;

const ICONS: Record<string, typeof BagIcon> = {
  "order.new": BagIcon,
  "order.status": TruckIcon,
  "customer.new": UserIcon,
  "customer.online": UserIcon,
  "visitor.new": EyeIcon,
  "contact.new": MailIcon,
  "chat.new": ChatIcon,
  "return.new": ReturnIcon,
  "product.change": BoxIcon,
  "collection.change": LayersIcon,
};

/** "just now", "12m", "3h", "5d" — compact enough for a dropdown row. */
function ago(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * A short two-note blip, synthesised rather than loaded, so no audio asset
 * ships and nothing is fetched.
 *
 * Autoplay policy is the real problem here: an AudioContext created without a
 * user gesture starts `suspended`, and calling resume() from a network callback
 * (which is what a poll is) does not lift it. So the context is created and
 * resumed on the admin's first interaction with the page — any pointer or key
 * event, captured once — and only then can a notification make a sound.
 *
 * `ready` reports whether that has happened, so the panel can say the sound is
 * waiting on a click rather than appearing to be broken.
 */
function useChime() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [ready, setReady] = useState(false);

  const unlock = useCallback(() => {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = (ctxRef.current ??= new Ctor());
      void ctx.resume().then(
        () => setReady(ctx.state === "running"),
        () => undefined,
      );
      if (ctx.state === "running") setReady(true);
    } catch {
      // No Web Audio in this browser — the badge still updates silently.
    }
  }, []);

  useEffect(() => {
    if (ready) return;
    // `once` on each: the first gesture of any kind arms audio for the session.
    const opts = { once: true, passive: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ready, unlock]);

  const play = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== "running") return;
    try {
      // Two soft sine notes, ~0.18s total, peaking well below full scale.
      [
        { freq: 880, at: 0 },
        { freq: 1174.7, at: 0.09 },
      ].forEach(({ freq, at }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const t0 = ctx.currentTime + at;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.18);
      });
    } catch {
      // A closed or interrupted context — never let a sound break the feed.
    }
  }, []);

  return { play, ready, unlock };
}

export function NotificationBell() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { play: chime, ready: soundReady, unlock } = useChime();

  // Ids already seen, so the sound fires for genuinely new arrivals only —
  // not on the first load, and not when the panel simply re-renders.
  const seenIds = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const feed = await adminGetNotifications();
    setItems(feed.notifications);
    setUnread(feed.unread);

    const ids = new Set(feed.notifications.map((n) => n.id));
    if (seenIds.current === null) {
      seenIds.current = ids; // First poll establishes the baseline silently.
      return;
    }
    const arrived = feed.notifications.some((n) => !seenIds.current!.has(n.id) && !n.read);
    seenIds.current = ids;
    if (arrived && !muted) chime();
  }, [chime, muted]);

  useEffect(() => {
    let alive = true;
    // The first poll is deferred out of the effect body: writing state
    // synchronously on mount cascades a second render before the first paints.
    const kickoff = setTimeout(() => {
      if (alive) void load();
    }, 0);
    const id = setInterval(() => {
      // Skip polling while the tab is hidden — it would queue a burst of
      // chimes for the moment the admin comes back.
      if (!document.hidden && alive) void load();
    }, POLL_MS);
    return () => {
      alive = false;
      clearTimeout(kickoff);
      clearInterval(id);
    };
  }, [load]);

  // Restore the mute preference, deferred for the same reason as the first poll.
  useEffect(() => {
    const id = setTimeout(
      () => setMuted(localStorage.getItem("conroy.admin.notifySound") === "off"),
      0,
    );
    return () => clearTimeout(id);
  }, []);

  function toggleMute() {
    setMuted((m) => {
      localStorage.setItem("conroy.admin.notifySound", m ? "on" : "off");
      return !m;
    });
  }

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markOne(id: string) {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    const feed = await adminMarkNotificationsRead(id);
    setItems(feed.notifications);
    setUnread(feed.unread);
  }

  async function markAll() {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    const feed = await adminMarkNotificationsRead();
    setItems(feed.notifications);
    setUnread(feed.unread);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-lg text-[#525252] transition-colors",
          "hover:bg-[#F5F5F4] hover:text-[#171717]",
          open && "bg-[#F5F5F4] text-[#171717]",
        )}
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 grid min-w-[1.05rem] place-items-center rounded-full",
              "bg-[#DC2626] px-1 text-[0.625rem] font-semibold leading-[1.05rem] text-white",
            )}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] overflow-hidden rounded-xl border",
            "border-[#E5E5E5] bg-white shadow-lg sm:w-[22rem]",
            // On a narrow screen the panel is anchored to the viewport rather
            // than the button, which would otherwise push it off-screen.
            "max-sm:fixed max-sm:right-4 max-sm:top-14",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#F0F0EE] px-4 py-3">
            <p className="text-[0.8125rem] font-medium text-[#171717]">
              Notifications
              {unread > 0 && <span className="ml-1.5 text-[#737373]">({unread} new)</span>}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // A click here is itself a gesture, so it can arm audio.
                  if (!soundReady) unlock();
                  toggleMute();
                }}
                className="text-[0.6875rem] text-[#737373] transition-colors hover:text-[#171717]"
                title={
                  muted
                    ? "Sound off"
                    : soundReady
                      ? "Sound on"
                      : "Sound is waiting for a click anywhere on the page"
                }
              >
                {muted ? "Sound off" : soundReady ? "Sound on" : "Sound blocked"}
              </button>
              {unread > 0 && (
                <>
                  <span className="h-3 w-px bg-[#E5E5E5]" />
                  <button
                    onClick={markAll}
                    className="text-[0.6875rem] font-medium text-[#171717] transition-colors hover:text-[#525252]"
                  >
                    Mark all read
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-[min(26rem,70vh)] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <BellIcon className="h-7 w-7 text-[#D4D4D4]" />
                <p className="text-[0.8125rem] text-[#737373]">No notifications yet.</p>
                <p className="text-[0.75rem] text-[#A3A3A3]">
                  New orders, customers and messages will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F0F0EE]">
                {items.map((n) => {
                  const Icon = ICONS[n.type] ?? BellIcon;
                  const body = (
                    <>
                      <span
                        className={cn(
                          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full",
                          n.read ? "bg-[#F5F5F4] text-[#A3A3A3]" : "bg-[#171717] text-white",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "truncate text-[0.8125rem]",
                              n.read ? "text-[#525252]" : "font-medium text-[#171717]",
                            )}
                          >
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]" />
                          )}
                          <span className="ml-auto shrink-0 text-[0.6875rem] text-[#A3A3A3]">
                            {ago(n.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[0.75rem] text-[#737373]">
                          {n.message}
                        </span>
                      </span>
                    </>
                  );

                  return (
                    <li key={n.id} className="group relative">
                      {n.href ? (
                        <Link
                          href={n.href}
                          onClick={() => {
                            setOpen(false);
                            if (!n.read) void markOne(n.id);
                          }}
                          className="flex gap-3 px-4 py-3 transition-colors hover:bg-[#FAFAF9]"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="flex gap-3 px-4 py-3">{body}</div>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => void markOne(n.id)}
                          className={cn(
                            "absolute bottom-2 right-3 rounded px-1.5 py-0.5 text-[0.625rem]",
                            "text-[#737373] opacity-0 transition-opacity hover:bg-[#F5F5F4]",
                            "hover:text-[#171717] focus:opacity-100 group-hover:opacity-100",
                          )}
                        >
                          Mark as read
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
