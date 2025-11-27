import dotenv from "dotenv";

dotenv.config();

const oauthConfig = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI as string,
  TOKEN_ENDPOINT: "https://oauth2.googleapis.com/token",
  USER_INFO_ENDPOINT: "https://www.googleapis.com/oauth2/v3/userinfo",
};

if (
  !oauthConfig.CLIENT_ID ||
  !oauthConfig.CLIENT_SECRET ||
  !oauthConfig.REDIRECT_URI
) {
  throw new Error(
    "Missing required Google OAuth server environment variables in .env file."
  );
}

export default oauthConfig;
