import { createContext, useContext } from "react";

const noop = () => {};

// Without a provider the hook still works, so a component can be rendered on its own.
export const ToastContext = createContext({ success: noop, error: noop, info: noop });

export const useToast = () => useContext(ToastContext);
