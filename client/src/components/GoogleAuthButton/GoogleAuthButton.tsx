import React from "react";
import OAUTH_CONFIG from "../../config/oauthConfig";
import { getAndStoreState } from "../../utils/authUtils";
import "./GoogleAuthButton.css";

interface GoogleAuthButtonProps {
  type?: "button" | "submit" | "reset";
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  type = "button",
}) => {
  const handleGoogleSignIn = (): void => {
    const state: string = getAndStoreState();

    const params = new URLSearchParams();
    params.append("client_id", OAUTH_CONFIG.CLIENT_ID);
    params.append("redirect_uri", OAUTH_CONFIG.REDIRECT_URI);
    params.append("response_type", "code");
    params.append("scope", OAUTH_CONFIG.SCOPES.join(" "));
    params.append("state", state);

    const fullAuthUrl: string = `${
      OAUTH_CONFIG.AUTH_ENDPOINT
    }?${params.toString()}`;

    window.location.href = fullAuthUrl;
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="google-auth-btn"
      type={type}
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/18px-Google_%22G%22_logo.svg.png"
        alt="Google G Logo"
        className="google-icon"
      />
      Sign in with Google
    </button>
  );
};

export default GoogleAuthButton;
