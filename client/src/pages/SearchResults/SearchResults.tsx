import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import Loading from "../../components/Loading/Loading";
import "./SearchResults.css";

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
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

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
      <div className="container mt-5">
        <Loading variant="page" text={`Searching for "${query}"...`} />
      </div>
    );
  }

  return (
    <div className="container mt-5 search-container">
      <h2>Search Results for: "{query}"</h2>
      <hr className="search-separator" />
      {totalResults === 0 ? (
        <p className="search-no-results">
          No events or users found matching "{query}".
        </p>
      ) : (
        <p className="text-muted search-found-text">
          Found {results.events.pagination.totalItems ?? 0} event(s) and{" "}
          {results.users.pagination.totalItems ?? 0} user(s).
        </p>
      )}
      <div className="row search-results-row">
        <div className="col-md-6 search-column">
          <h3 className="search-subheader">
            Events ({results.events.pagination.totalItems})
          </h3>
          <ul className="list-group search-list-group">
            {results.events.results.length === 0 ? (
              <p className="search-empty-message p-3">No events found.</p>
            ) : (
              results.events.results.map((event) => (
                <li
                  key={event.id}
                  className="list-group-item d-flex justify-content-between align-items-center search-list-item"
                >
                  <Link to={`/event/${event.id}`} className="search-event-link">
                    {event.title}
                  </Link>
                  <small className="text-muted search-small-text">
                    {format(new Date(event.event_datetime), "MMM dd, yyyy @ p")}
                  </small>
                </li>
              ))
            )}
          </ul>
          <div className="search-pagination-wrapper">
            {results.events.pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={results.events.pagination.currentPage}
                totalPages={results.events.pagination.totalPages}
                onPageChange={setEventPage}
              />
            )}
          </div>
        </div>
        <div className="col-md-6 search-column">
          <h3 className="search-subheader">
            Users ({results.users.pagination.totalItems})
          </h3>
          <ul className="list-group search-list-group">
            {results.users.results.length === 0 ? (
              <p className="search-empty-message p-3">No users found.</p>
            ) : (
              results.users.results.map((user) => (
                <li key={user.id} className="list-group-item search-list-item">
                  <Link
                    to={`/user/${user.username}`}
                    className="search-user-link"
                  >
                    {user.username}
                  </Link>
                </li>
              ))
            )}
          </ul>
          <div className="search-pagination-wrapper">
            {results.users.pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={results.users.pagination.currentPage}
                totalPages={results.users.pagination.totalPages}
                onPageChange={setUserPage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
