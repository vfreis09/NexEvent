interface OAuthClientConfig {
  CLIENT_ID: string;
  REDIRECT_URI: string;
  SCOPES: string[];
  AUTH_ENDPOINT: string;
}

const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set!`);
  }
  return value;
};

const OAUTH_CONFIG: OAuthClientConfig = {
  CLIENT_ID: getEnvVar("VITE_PUBLIC_GOOGLE_CLIENT_ID"),
  REDIRECT_URI: getEnvVar("VITE_PUBLIC_GOOGLE_REDIRECT_URI"),

  SCOPES: getEnvVar("VITE_PUBLIC_GOOGLE_SCOPES")
    .split(",")
    .map((s) => s.trim()),
  AUTH_ENDPOINT: getEnvVar("VITE_PUBLIC_GOOGLE_AUTH_ENDPOINT"),
};

export default OAUTH_CONFIG;
