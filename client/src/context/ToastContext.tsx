import React, { createContext, useState, useCallback, ReactNode } from "react";

export interface ToastInfo {
  message: string;
  header: string;
  bg: string;
  textColor?: string;
}

export interface ToastContextType {
  showToast: boolean;
  toastInfo: ToastInfo | null;
  showNotification: (
    message: string,
    header: string,
    bg: string,
    textColor?: string,
  ) => void;
  hideToast: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined,
);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [showToast, setShowToast] = useState(false);
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);

  const showNotification = useCallback(
    (
      message: string,
      header: string,
      bg: string,
      textColor: string = "white",
    ) => {
      setToastInfo({ message, header, bg, textColor });
      setShowToast(true);
    },
    [],
  );

  const hideToast = useCallback(() => {
    setShowToast(false);
    setToastInfo(null);
  }, []);

  return (
    <ToastContext.Provider
      value={{ showToast, toastInfo, showNotification, hideToast }}
    >
      {children}
    </ToastContext.Provider>
  );
};
