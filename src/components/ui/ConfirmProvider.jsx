import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ConfirmContext } from "./confirm-context";

export default function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);
  const cancelRef = useRef(null);

  const settle = useCallback((answer) => {
    resolver.current?.(answer);
    resolver.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setDialog(options);
      }),
    []
  );

  useEffect(() => {
    if (!dialog) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") settle(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className="anim-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => settle(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="anim-scale-in clay w-full max-w-sm rounded-2xl p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
              <AlertTriangle size={22} />
            </div>
            <h2 id="confirm-title" className="text-lg font-semibold text-white">
              {dialog.title || "Are you sure?"}
            </h2>
            {dialog.message && <p className="mt-2 text-sm leading-relaxed text-gray-400">{dialog.message}</p>}
            <div className="mt-6 flex gap-3">
              <button
                ref={cancelRef}
                onClick={() => settle(false)}
                className="btn-ghost flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-200"
              >
                Cancel
              </button>
              <button onClick={() => settle(true)} className="btn-danger flex-1 rounded-xl px-4 py-2.5 text-sm">
                {dialog.confirmText || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
