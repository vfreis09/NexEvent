import { Session } from "express-session";

declare module "express-session" {
  interface Session {
    user: {
      id: number | undefined;
      user_id: number | undefined;
    };
  }
}
