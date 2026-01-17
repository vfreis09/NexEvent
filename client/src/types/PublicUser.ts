export interface PublicUser {
  id: number;
  username: string;
  email?: string;
  created_at: string;
  total_created_events: number;
  total_accepted_rsvps: number;
  profile_picture_base64: string | null;
}
