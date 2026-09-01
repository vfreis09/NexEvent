import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  show: boolean;
  message: string;
  header: string;
  bg: string;
  textColor?: string;
  onClose: () => void;
}

const bgStyles: Record<string, string> = {
  success: "bg-primary text-primary-foreground border-transparent",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-accent text-accent-foreground border-transparent",
  default: "bg-card text-card-foreground border-border",
};

const AppToast: React.FC<ToastProps> = ({
  show,
  message,
  header,
  bg,
  onClose,
}) => {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[100] w-80"
    >
      <div
        className={cn(
          "rounded border p-4 shadow-lg",
          bgStyles[bg] ?? bgStyles.default,
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <strong className="text-sm font-medium">{header}</strong>
          <button
            onClick={onClose}
            aria-label="Dismiss notification"
            className="text-current opacity-70 transition-opacity hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

export default AppToast;