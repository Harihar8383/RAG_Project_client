import { createContext, useContext } from "react";

// Without a provider the hook falls back to the browser dialog, so a component can still be used on its own.
export const ConfirmContext = createContext((options) =>
  Promise.resolve(typeof window !== "undefined" && window.confirm(options.message || options.title))
);

export const useConfirm = () => useContext(ConfirmContext);
