export interface EventData {
  id: number;
  title: string;
  description: string;
  location: {
    x: number;
    y: number;
  };
  address: string;
  event_datetime: string;
  number_of_attendees: number;
  max_attendees: number | null;
  author_id: number;
  status: string;
  created_at: string;
  author_username: string;
}
