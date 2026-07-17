"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ui/Toast";
import {
  fetchAddresses,
  saveAddresses,
  formatAddress,
  type Address,
} from "@/services/addresses";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, TruckIcon, CheckIcon, CloseIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

const field =
  "h-12 w-full rounded-md border border-line bg-white px-3 text-[15px] text-ink placeholder:text-stone focus:border-ink focus:outline-none";

const EMPTY = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export function AddressBook() {
  const { user, initializing } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [list, setList] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  // Protect the route — bounce to login when signed out.
  useEffect(() => {
    if (!initializing && !user) router.replace("/account/login");
  }, [initializing, user, router]);

  useEffect(() => {
    if (!user?.phone) return;
    let active = true;
    fetchAddresses(user.phone)
      .then((a) => active && (setList(a), setLoading(false)))
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user?.phone]);

  function validate(): string | null {
    if (!form.fullName.trim()) return "Please enter the recipient's name.";
    if (!/^[0-9]{10}$/.test(form.phone.replace(/\D/g, "").slice(-10)))
      return "Enter a valid 10-digit phone number.";
    if (!form.line1.trim()) return "Please enter the address.";
    if (!form.city.trim()) return "Please enter the city.";
    if (!form.state.trim()) return "Please enter the state.";
    if (!/^[0-9]{6}$/.test(form.pincode.trim())) return "Enter a valid 6-digit pincode.";
    return null;
  }

  async function persist(next: Address[]) {
    if (!user?.phone) return;
    setSaving(true);
    try {
      const saved = await saveAddresses(user.phone, next);
      setList(saved);
    } catch {
      toast("Couldn't save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      toast(problem, "error");
      return;
    }
    setError("");

    const entry: Address = {
      id: editingId ?? crypto.randomUUID(),
      ...form,
      isDefault: editingId ? (list.find((a) => a.id === editingId)?.isDefault ?? false) : list.length === 0,
    };
    const next = editingId ? list.map((a) => (a.id === editingId ? entry : a)) : [...list, entry];
    await persist(next);
    toast(editingId ? "Address updated." : "Address saved.", "success");
    setForm({ ...EMPTY });
    setEditingId(null);
    setShowForm(false);
  }

  function edit(a: Address) {
    setForm({
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    });
    setEditingId(a.id);
    setShowForm(true);
    setError("");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this address?")) return;
    await persist(list.filter((a) => a.id !== id));
    toast("Address deleted.", "success");
  }

  async function makeDefault(id: string) {
    await persist(list.map((a) => ({ ...a, isDefault: a.id === id })));
    toast("Default address updated.", "success");
  }

  if (initializing || !user) {
    return (
      <Container className="py-20">
        <div className="grid place-items-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/account/profile"
        className="inline-flex items-center gap-1 text-sm text-stone transition-colors hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" /> Back to account
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Addresses</h1>
          <p className="mt-1 text-sm text-stone">
            Saved addresses are filled in automatically at checkout.
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              setForm({ ...EMPTY });
              setEditingId(null);
              setShowForm(true);
            }}
          >
            Add new address
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={submit} className="mt-6 rounded-media border border-line bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">
              {editingId ? "Edit address" : "New address"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setError("");
              }}
              aria-label="Cancel"
              className="grid h-8 w-8 place-items-center rounded-full text-stone hover:bg-mist hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Full name"
              className={field}
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="Phone number"
              inputMode="numeric"
              className={field}
            />
            <input
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              placeholder="House / flat, street"
              className={cn(field, "sm:col-span-2")}
            />
            <input
              value={form.line2}
              onChange={(e) => setForm({ ...form, line2: e.target.value })}
              placeholder="Area, landmark (optional)"
              className={cn(field, "sm:col-span-2")}
            />
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City"
              className={field}
            />
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="State"
              className={field}
            />
            <input
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              placeholder="Pincode"
              inputMode="numeric"
              className={field}
            />
          </div>

          {error && <p className="mt-3 text-xs text-accent">{error}</p>}

          <div className="mt-5 flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update address" : "Save address"}
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
        </div>
      ) : list.length === 0 && !showForm ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-media border border-line bg-white py-16 text-center">
          <TruckIcon className="h-9 w-9 text-stone" />
          <p className="text-stone">No saved addresses yet.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <li
              key={a.id}
              className={cn(
                "rounded-media border bg-white p-5",
                a.isDefault ? "border-ink" : "border-line",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{a.fullName}</p>
                  <p className="text-xs text-stone">{a.phone}</p>
                </div>
                {a.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-white">
                    <CheckIcon className="h-3 w-3" /> Default
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft">{formatAddress(a)}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => edit(a)}
                  className="rounded-md border border-line px-3 py-1.5 text-ink transition-colors hover:border-ink"
                >
                  Edit
                </button>
                {!a.isDefault && (
                  <button
                    onClick={() => makeDefault(a.id)}
                    className="rounded-md border border-line px-3 py-1.5 text-ink transition-colors hover:border-ink"
                  >
                    Set as default
                  </button>
                )}
                <button
                  onClick={() => remove(a.id)}
                  className="rounded-md border border-line px-3 py-1.5 text-stone transition-colors hover:border-accent hover:text-accent"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
