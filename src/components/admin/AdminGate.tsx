"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminKey, clearAdminKey } from "@/lib/admin-auth";
import { adminVerifyKey } from "@/services/admin";

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

  if (state === "checking") {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
      </div>
    );
  }

  return <>{children}</>;
}
