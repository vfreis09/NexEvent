import React from "react";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";

interface ToastProps {
  show: boolean;
  message: string;
  header: string;
  bg: string;
  textColor?: string;
  onClose: () => void;
}

const AppToast: React.FC<ToastProps> = ({
  show,
  message,
  header,
  bg,
  textColor,
  onClose,
}) => {
  return (
    <ToastContainer
      className="p-3"
      position="bottom-end"
      style={{ position: "fixed", zIndex: 1050 }}
    >
      <Toast show={show} onClose={onClose} bg={bg} delay={3000} autohide>
        <Toast.Header>
          <strong className="me-auto">{header}</strong>
        </Toast.Header>
        <Toast.Body className={`text-${textColor}`}>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default AppToast;
