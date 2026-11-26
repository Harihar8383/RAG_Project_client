import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { ToastContext } from "./toast-context";

const DURATION_MS = 4200;
const MAX_TOASTS = 4;

const STYLES = {
  success: { icon: CheckCircle2, ring: "text-emerald-300", bar: "bg-emerald-400" },
  error: { icon: XCircle, ring: "text-rose-300", bar: "bg-rose-400" },
  info: { icon: Info, ring: "text-sky-300", bar: "bg-sky-400" },
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, type, message }]);
      timers.current.set(id, setTimeout(() => dismiss(id), DURATION_MS));
    },
    [dismiss]
  );

  // Every timer is cleared when the provider unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const api = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[70] flex w-[min(92vw,360px)] flex-col gap-3" aria-live="polite">
        {toasts.map((t) => {
          const s = STYLES[t.type];
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              role="status"
              style={{ "--toast-ms": `${DURATION_MS}ms` }}
              className="toast-enter clay relative flex items-start gap-3 overflow-hidden rounded-xl px-4 py-3 pr-10 text-sm text-gray-100"
            >
              <Icon size={18} className={`mt-0.5 shrink-0 anim-pop ${s.ring}`} />
              <span>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X size={14} />
              </button>
              <span className={`toast-timer absolute bottom-0 left-0 h-[3px] w-full ${s.bar}`} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
