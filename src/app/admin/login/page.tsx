"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminVerifyKey } from "@/services/admin";
import { setAdminKey } from "@/lib/admin-auth";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) {
      setError("Enter the admin key.");
      return;
    }
    setError("");
    setLoading(true);
    const ok = await adminVerifyKey(key.trim());
    setLoading(false);
    if (ok) {
      setAdminKey(key.trim());
      router.replace("/admin/products");
    } else {
      setError("Invalid admin key. Please try again.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-media border border-line bg-white p-8 shadow-sm">
        <p className="text-center font-display text-xl font-semibold tracking-[0.22em] text-ink">
          CONROY
        </p>
        <p className="mt-1 text-center text-xs uppercase tracking-wide text-stone">Admin</p>

        <h1 className="mt-6 font-display text-2xl text-ink">Sign in to admin</h1>
        <p className="mt-1 text-sm text-stone">Enter your admin key to manage the store.</p>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          autoFocus
          className="mt-5 h-12 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none"
        />
        {error && <p className="mt-2 text-xs text-accent">{error}</p>}

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={loading}>
          {loading ? "Checking…" : "Enter admin"}
        </Button>
      </form>
    </div>
  );
}
