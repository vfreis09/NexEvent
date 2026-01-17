import React from "react";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import "./ToastComponent.css";

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
  textColor = "white",
  onClose,
}) => {
  return (
    <ToastContainer className="app-toast-container">
      <Toast
        show={show}
        onClose={onClose}
        bg={bg}
        delay={3000}
        autohide
        className="custom-toast"
      >
        <Toast.Header>
          <strong className="me-auto">{header}</strong>
        </Toast.Header>
        <Toast.Body className={`text-${textColor}`}>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default AppToast;
