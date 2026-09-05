import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, User } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import Loading from "../../components/Loading/Loading";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface EventResult {
  id: number;
  title: string;
  event_datetime: string;
  address: string;
}

interface UserResult {
  id: number;
  username: string;
}

interface PaginatedResults<T> {
  results: T[];
  pagination: Pagination;
}

interface SearchData {
  events: PaginatedResults<EventResult>;
  users: PaginatedResults<UserResult>;
}

const initialPaginationState: Pagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
};

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [eventPage, setEventPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const resultsPerPage = 10;

  useTheme();

  const { data, isLoading } = useQuery<SearchData>({
    queryKey: ["search", query, eventPage, userPage],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/search?q=${query}&eventPage=${eventPage}&eventLimit=${resultsPerPage}&userPage=${userPage}&userLimit=${resultsPerPage}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !!query,
    staleTime: 1000 * 60 * 5,
  });

  const results: SearchData = data ?? {
    events: { results: [], pagination: initialPaginationState },
    users: { results: [], pagination: initialPaginationState },
  };

  const totalResults =
    results.events.pagination.totalItems + results.users.pagination.totalItems;

  if (isLoading) {
    return (
      <div className="mx-auto mt-10 max-w-5xl px-4">
        <Loading variant="page" text={`Searching for "${query}"...`} />
      </div>
    );
  }

  return (
    <div className="mx-auto mb-16 mt-8 max-w-5xl px-4">
      <h2 className="text-2xl font-semibold text-foreground">
        Search Results for: "{query}"
      </h2>
      <hr className="my-4 border-border" />

      {totalResults === 0 ? (
        <div className="mb-6 rounded-lg border-l-4 border-primary bg-primary/10 px-4 py-3 text-sm text-foreground">
          No events or users found matching "{query}".
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          Found {results.events.pagination.totalItems ?? 0} event(s) and{" "}
          {results.users.pagination.totalItems ?? 0} user(s).
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* EVENTS COLUMN */}
        <div className="flex flex-col">
          <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-foreground">
            <Calendar size={16} />
            Events ({results.events.pagination.totalItems})
          </h3>

          <div className="flex flex-1 flex-col rounded-xl border border-border bg-card">
            {results.events.results.length === 0 ? (
              <p className="p-4 text-sm italic text-muted-foreground">
                No events found.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {results.events.results.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <Link
                      to={`/event/${event.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {event.title}
                    </Link>
                    <span className="text-xs text-muted-foreground sm:whitespace-nowrap">
                      {format(new Date(event.event_datetime), "MMM dd, yyyy @ p")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {results.events.pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <PaginationControls
                currentPage={results.events.pagination.currentPage}
                totalPages={results.events.pagination.totalPages}
                onPageChange={setEventPage}
              />
            </div>
          )}
        </div>

        {/* USERS COLUMN */}
        <div className="flex flex-col">
          <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-foreground">
            <User size={16} />
            Users ({results.users.pagination.totalItems})
          </h3>

          <div className="flex flex-1 flex-col rounded-xl border border-border bg-card">
            {results.users.results.length === 0 ? (
              <p className="p-4 text-sm italic text-muted-foreground">
                No users found.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {results.users.results.map((user) => (
                  <li key={user.id} className="px-4 py-3">
                    <Link
                      to={`/user/${user.username}`}
                      className="text-sm font-medium text-green-600 hover:underline dark:text-green-500"
                    >
                      {user.username}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {results.users.pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <PaginationControls
                currentPage={results.users.pagination.currentPage}
                totalPages={results.users.pagination.totalPages}
                onPageChange={setUserPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;