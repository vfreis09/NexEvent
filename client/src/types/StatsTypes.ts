export interface Totals {
  total_users: number;
  total_events: number;
  total_rsvps: number;
}

export interface MonthlyData {
  month: string;
  total: number;
}

export interface StatusData {
  status: string;
  total: number;
}

export interface Stats {
  totals: Totals;
  events_per_month: MonthlyData[];
  event_status: StatusData[];
}
