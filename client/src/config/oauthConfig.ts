interface OAuthClientConfig {
  CLIENT_ID: string;
  REDIRECT_URI: string;
  SCOPES: string[];
  AUTH_ENDPOINT: string;
}

const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    if (key === "VITE_PUBLIC_GOOGLE_AUTH_ENDPOINT")
      return "https://accounts.google.com/o/oauth2/v2/auth";
    throw new Error(`Environment variable ${key} is not set!`);
  }
  return value;
};

const isLocal = window.location.hostname === "localhost";
const prodRedirect =
  "https://nexevent-app-production.up.railway.app/api/user/google/callback";
const localRedirect = "http://localhost:3000/api/user/google/callback";

const OAUTH_CONFIG: OAuthClientConfig = {
  CLIENT_ID: getEnvVar("VITE_PUBLIC_GOOGLE_CLIENT_ID"),

  REDIRECT_URI: isLocal ? localRedirect : prodRedirect,

  SCOPES: getEnvVar("VITE_PUBLIC_GOOGLE_SCOPES")
    .split(",")
    .map((s) => s.trim()),
  AUTH_ENDPOINT: getEnvVar("VITE_PUBLIC_GOOGLE_AUTH_ENDPOINT"),
};

export default OAUTH_CONFIG;
