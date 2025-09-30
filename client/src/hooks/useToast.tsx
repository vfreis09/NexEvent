import { useState, useCallback } from "react";

interface ToastInfo {
  message: string;
  header: string;
  bg: string;
  textColor?: string;
}

export const useToast = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);

  const showNotification = useCallback(
    (
      message: string,
      header: string,
      bg: string,
      textColor: string = "white"
    ) => {
      setToastInfo({ message, header, bg, textColor });
      setShowToast(true);
    },
    []
  );

  const hideToast = useCallback(() => {
    setShowToast(false);
    setToastInfo(null);
  }, []);

  return {
    showToast,
    toastInfo,
    showNotification,
    hideToast,
  };
};
