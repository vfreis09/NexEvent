import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

export const useToast = () => {
  const context = useContext(ToastContext);

  // This safety check ensures you don't try to use toasts
  // in a part of the app not wrapped by the Provider.
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};
