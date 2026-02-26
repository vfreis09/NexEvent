interface OAuthClientConfig {
  REDIRECT_URI: string;
}

const isLocal = window.location.hostname === "localhost";
const prodRedirect =
  "https://nexevent-app-production.up.railway.app/api/user/google/callback";
const localRedirect = "http://localhost:3000/api/user/google/callback";

const OAUTH_CONFIG: OAuthClientConfig = {
  REDIRECT_URI: isLocal ? localRedirect : prodRedirect,
};

export default OAUTH_CONFIG;
