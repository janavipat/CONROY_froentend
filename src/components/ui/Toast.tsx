"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, CloseIcon } from "@/components/ui/Icons";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++counter.current;
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-black/5 bg-white/90 p-3.5 pr-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#17171a]/90"
            >
              <span
                className={
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white " +
                  (t.type === "success"
                    ? "bg-emerald-500"
                    : t.type === "error"
                      ? "bg-rose-500"
                      : "bg-ink dark:bg-white dark:text-ink")
                }
              >
                {t.type === "success" ? (
                  <CheckIcon className="h-3 w-3" />
                ) : t.type === "error" ? (
                  <CloseIcon className="h-3 w-3" />
                ) : (
                  <span className="text-[0.7rem] font-bold">i</span>
                )}
              </span>
              <p className="flex-1 text-sm leading-snug text-ink dark:text-zinc-100">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
                className="rounded-md p-1 text-stone transition-colors hover:text-ink dark:hover:text-white"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
