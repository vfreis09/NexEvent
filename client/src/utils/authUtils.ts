const STATE_COOKIE_NAME: string = "google_oauth_state";
const STATE_LENGTH = 30;

const generateRandomString = (length: number): string => {
  const characters: string =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result: string = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const getAndStoreState = (): string => {
  const state: string = generateRandomString(STATE_LENGTH);

  document.cookie = `${STATE_COOKIE_NAME}=${state}; path=/; max-age=60; secure=false; sameSite=Lax`;

  return state;
};
