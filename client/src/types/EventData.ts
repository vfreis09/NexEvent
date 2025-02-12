export interface EventData {
  id: number;
  title: string;
  description: string;
  location: {
    x: number;
    y: number;
  };
  event_datetime: string;
  number_of_attendees: number;
  author_id: number;
  status: string;
  created_at: string;
}
