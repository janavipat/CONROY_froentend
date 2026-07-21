"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { updateAccountName } from "@/services/auth";
import { useToast } from "@/components/ui/Toast";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { Loader } from "@/components/ui/Loader";
import { MyOrders } from "./MyOrders";
import {
  ArrowRightIcon,
  BagIcon,
  CheckIcon,
  CloseIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
} from "@/components/ui/Icons";

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Formats +919998009904 → +91 99980 09904 for display. */
function prettyPhone(phone: string): string {
  const m = phone.match(/^(\+\d{1,3})(\d{5})(\d{5})$/);
  return m ? `${m[1]} ${m[2]} ${m[3]}` : phone || "—";
}

const QUICK_LINKS = [
  {
    icon: BagIcon,
    title: "Orders",
    body: "Track, return or buy things again.",
    href: "#orders",
    cta: "View orders",
  },
  {
    icon: TruckIcon,
    title: "Addresses",
    body: "Save delivery addresses for faster checkout.",
    href: "/account/addresses",
    cta: "Manage addresses",
  },
  {
    icon: PhoneIcon,
    title: "Support",
    body: "Questions about sizing, orders or returns.",
    href: "/contact",
    cta: "Contact us",
  },
];

export function ProfileExperience() {
  const { user, initializing, signOut, setUserName } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Protect the route — bounce to login when signed out.
  useEffect(() => {
    if (!initializing && !user) router.replace("/account/login");
  }, [initializing, user, router]);

  function startEditingName() {
    setNameValue(user?.name ?? "");
    setEditingName(true);
  }

  async function saveName() {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      toast("Please enter your name.", "error");
      return;
    }
    if (!user) return;
    setSavingName(true);
    const res = await updateAccountName(user.phone, trimmed);
    setSavingName(false);
    if (res.ok) {
      setUserName(res.name ?? trimmed);
      setEditingName(false);
      toast("Name updated.", "success");
    } else {
      toast(res.message, "error");
    }
  }

  if (initializing || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader />
      </div>
    );
  }

  const initials = (user.phone || "U").replace(/\D/g, "").slice(-2) || "U";

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <Container className="py-12 lg:py-16">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">Welcome back</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>

      {/* Account summary card */}
      <Reveal className="mt-8 overflow-hidden rounded-media border border-line bg-paper">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-base font-medium text-white">
              {initials}
            </span>
            <div className="min-w-0">
              {editingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    placeholder="Your name"
                    disabled={savingName}
                    className="h-10 w-48 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-ink"
                  />
                  <button
                    onClick={() => void saveName()}
                    disabled={savingName}
                    className="rounded-md bg-ink px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {savingName ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    disabled={savingName}
                    aria-label="Cancel"
                    className="grid h-8 w-8 place-items-center rounded-md text-stone hover:bg-mist hover:text-ink"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditingName}
                  className="group flex items-center gap-2 font-display text-xl text-ink"
                >
                  {user.name || <span className="text-stone">Add your name</span>}
                  <EditIcon className="h-4 w-4 text-stone opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              <p className="mt-1 text-sm text-ink-soft">{prettyPhone(user.phone)}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-stone">
                <CheckIcon className="h-4 w-4 text-accent" /> Phone verified
              </span>
            </div>
          </div>
          <Button href="/collections/all" size="md">
            Continue shopping
          </Button>
        </div>
      </Reveal>

      {/* Quick links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link, i) => (
          <Reveal key={link.title} index={i} as="div">
            <Link
              href={link.href}
              className="group flex h-full flex-col rounded-media border border-line bg-white p-6 transition-colors hover:border-ink"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-mist text-ink">
                <link.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-lg text-ink">{link.title}</h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">{link.body}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink">
                {link.cta}
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Account details */}
      <Reveal className="mt-10">
        <h2 className="font-display text-xl text-ink">Account details</h2>
        <dl className="mt-4 divide-y divide-line rounded-media border border-line bg-white">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <dt className="flex items-center gap-3 text-sm text-stone">
              <UserIcon className="h-4 w-4" /> Name
            </dt>
            <dd className="flex items-center gap-3 text-sm text-ink">
              {user.name || <span className="text-stone">Not set</span>}
              <button
                onClick={startEditingName}
                className="text-xs font-medium text-ink underline-offset-2 hover:underline"
              >
                Edit
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <dt className="flex items-center gap-3 text-sm text-stone">
              <PhoneIcon className="h-4 w-4" /> Mobile number
            </dt>
            <dd className="text-sm text-ink">{prettyPhone(user.phone)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <dt className="flex items-center gap-3 text-sm text-stone">
              <UserIcon className="h-4 w-4" /> Sign-in method
            </dt>
            <dd className="text-sm text-ink">Phone OTP</dd>
          </div>
        </dl>
      </Reveal>

      {/* Order history */}
      <Reveal className="mt-12">
        <MyOrders phone={user.phone} />
      </Reveal>
    </Container>
  );
}
