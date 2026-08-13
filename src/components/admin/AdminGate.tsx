"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminKey, clearAdminKey } from "@/lib/admin-auth";
import { adminVerifyKey } from "@/services/admin";
import { BrandLoader } from "./ui";

/** Blocks admin content until a valid admin key is present. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    let active = true;
    const check = async () => {
      const key = getAdminKey();
      if (!key) {
        router.replace("/admin/login");
        return;
      }
      const ok = await adminVerifyKey(key);
      if (!active) return;
      if (ok) {
        setState("ok");
      } else {
        clearAdminKey();
        router.replace("/admin/login");
      }
    };
    check();
    return () => {
      active = false;
    };
  }, [router]);

  // The first thing anyone sees on opening an admin page — the key check runs
  // before the page's own data fetch, so this is the loading state that
  // actually shows. It uses the branded loader for that reason.
  if (state === "checking") {
    return <BrandLoader label="Verifying your session" />;
  }

  return <>{children}</>;
}
