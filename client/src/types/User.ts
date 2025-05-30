export interface User {
  id: number;
  email: string;
  username: string;
  bio: string;
  contact: string;
  is_verified: boolean;
  wants_notifications: boolean;
}
