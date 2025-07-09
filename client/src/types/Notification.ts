export interface Notification {
  id: number;
  message: string;
  event_id: number;
  is_read: boolean;
  invite_id?: number;
  invite_status?: string | null;
}
