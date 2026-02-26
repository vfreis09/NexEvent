import React from "react";
import googleLogo from "../../assets/google-logo.png";
import "./GoogleAuthButton.css";

interface GoogleAuthButtonProps {
  type?: "button" | "submit" | "reset";
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  type = "button",
}) => {
  const BACKEND_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://nexevent-app-production.up.railway.app";

  const handleGoogleSignIn = (): void => {
    window.location.href = `${BACKEND_URL}/api/user/google/login`;
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="google-auth-btn"
      type={type}
    >
      <img src={googleLogo} alt="Google Logo" className="google-icon" />
      <span>Sign in with Google</span>
    </button>
  );
};

export default GoogleAuthButton;
