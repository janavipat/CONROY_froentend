"use client";

import { useEffect, useState } from "react";
import { fetchSiteSettings, isOn } from "@/services/settings";

/** Store-wide notice shown when the admin turns on maintenance mode. */
export function MaintenanceBanner() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchSiteSettings().then((s) => active && setOn(isOn(s, "store.maintenance")));
    return () => {
      active = false;
    };
  }, []);

  if (!on) return null;

  return (
    <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
      We&apos;re doing a little maintenance — some features may be briefly unavailable. Thanks for your
      patience.
    </div>
  );
}
