"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/utils/cn";

/** How long the "Back online" confirmation stays up before fading out. */
const ONLINE_TOAST_MS = 3000;

/**
 * Global connectivity indicator. Shows a persistent "Offline" pill the whole
 * time the connection is down, then a brief "Back online" confirmation once it
 * returns. Stays silent for a normal, always-connected visit.
 *
 * Mounted once in Providers, so it covers the storefront and the admin panel.
 */
export function ConnectionStatus() {
  const online = useOnlineStatus();
  const [visible, setVisible] = useState(false);
  // Only announce "Back online" if we actually dropped first — otherwise every
  // page load would flash a confirmation at a perfectly connected visitor.
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setVisible(true);
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), ONLINE_TOAST_MS);
    return () => clearTimeout(timer);
  }, [online]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 24, x: "-50%" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 z-[100]"
        >
          <div
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-pill px-4 py-2.5 text-sm font-medium text-white shadow-lg",
              online ? "bg-green-600" : "bg-rose-600",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                online ? "bg-green-200" : "animate-pulse bg-rose-200",
              )}
            />
            {online ? "Back online" : "You're offline — check your connection"}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
