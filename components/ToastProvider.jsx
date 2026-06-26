"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);
export { ToastContext };
const AUTO_DISMISS_MS = 5000;
// Keep the visible toast stack small so bursty errors do not cover the viewport.
const MAX_TOASTS = 3;
const VARIANT_STYLES = {
  success: {
    base: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    accent: "text-emerald-300",
    icon: "✅",
    label: "Success",
  },
  error: {
    base: "border-red-500/30 bg-red-500/10 text-red-100",
    accent: "text-red-300",
    icon: "❌",
    label: "Error",
  },
  info: {
    base: "border-cyan-500/20 bg-cyan-500/10 text-cyan-100",
    accent: "text-cyan-300",
    icon: "ℹ️",
    label: "Info",
  },
};

function getToastKey({ variant = "info", title, message }) {
  return `${variant}::${title || ""}::${message || ""}`;
}

function createToast({ variant = "info", title, message }) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    variant,
    title: title || VARIANT_STYLES[variant]?.label || "Notice",
    message,
    key: getToastKey({ variant, title, message }),
    autoDismiss: true,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const clearToastTimer = useCallback((id) => {
    const timeout = timers.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timers.current.delete(id);
    }
  }, []);

  const removeToast = useCallback(
    (id) => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      clearToastTimer(id);
    },
    [clearToastTimer]
  );

  const scheduleToastTimer = useCallback(
    (id) => {
      clearToastTimer(id);
      const timeout = setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
      timers.current.set(id, timeout);
    },
    [clearToastTimer, removeToast]
  );

  const addToast = useCallback(
    ({ variant, title, message }) => {
      const nextToast = createToast({ variant, title, message });
      const key = nextToast.key;
      let timerAction = null;

      setToasts((current) => {
        const existingIndex = current.findIndex((toast) => toast.key === key);

        if (existingIndex !== -1) {
          const existingToast = current[existingIndex];
          timerAction = { type: "refresh", id: existingToast.id };
          return current;
        }

        if (current.length >= MAX_TOASTS) {
          timerAction = {
            type: "replace",
            removedId: current[current.length - 1].id,
            id: nextToast.id,
          };
          const next = [nextToast, ...current.slice(0, MAX_TOASTS - 1)];
          return next;
        }

        timerAction = { type: "add", id: nextToast.id };
        return [nextToast, ...current];
      });

      if (timerAction?.type === "refresh") {
        scheduleToastTimer(timerAction.id);
        return;
      }

      if (timerAction?.type === "replace") {
        clearToastTimer(timerAction.removedId);
        scheduleToastTimer(timerAction.id);
        return;
      }

      if (timerAction?.type === "add") {
        scheduleToastTimer(timerAction.id);
      }
    },
    [clearToastTimer, scheduleToastTimer]
  );

  const pauseToast = useCallback(
    (id) => {
      clearToastTimer(id);
    },
    [clearToastTimer]
  );

  const resumeToast = useCallback(
    (id) => {
      if (timers.current.has(id)) {
        return;
      }
      setToasts((current) => {
        const toastExists = current.some((toast) => toast.id === id);
        if (!toastExists) return current;
        scheduleToastTimer(id);
        return current;
      });
    },
    [scheduleToastTimer]
  );

  useEffect(() => {
  const currentTimers = timers.current;
  return () => {
    currentTimers.forEach((timeout) => clearTimeout(timeout));
    currentTimers.clear();
  };
}, []);

  const value = useMemo(
    () => ({
      success: (message, title) => addToast({ variant: "success", title, message }),
      error: (message, title) => addToast({ variant: "error", title, message }),
      info: (message, title) => addToast({ variant: "info", title, message }),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:justify-end sm:px-6"
      >
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((toast) => {
            const variant = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info;

            return (
              <div
                key={toast.id}
                onMouseEnter={() => pauseToast(toast.id)}
                onMouseLeave={() => resumeToast(toast.id)}
                className={`pointer-events-auto overflow-hidden rounded-3xl border p-4 shadow-2xl shadow-slate-950/30 transition duration-200 ${variant.base}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-xl" aria-hidden="true">
                    {variant.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{toast.message}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-slate-700/80 bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-slate-100 outline-none transition duration-150 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-cyan-400"
                    aria-label="Dismiss notification"
                    onClick={() => removeToast(toast.id)}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
