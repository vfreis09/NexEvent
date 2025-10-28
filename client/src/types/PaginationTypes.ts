import { EventData } from "./EventData";

interface PaginationData {
  totalEvents: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface PaginatedResponse {
  events: EventData[];
  pagination: PaginationData;
}
