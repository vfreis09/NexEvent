import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
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

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [loading, setLoading] = useState(true);

  const [eventPage, setEventPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const resultsPerPage = 10;

  const [results, setResults] = useState<SearchData>({
    events: { results: [], pagination: initialPaginationState },
    users: { results: [], pagination: initialPaginationState },
  });

  useTheme();

  const fetchResults = useCallback(async () => {
    if (!query) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/search?q=${query}&eventPage=${eventPage}&eventLimit=${resultsPerPage}&userPage=${userPage}&userLimit=${resultsPerPage}`
      );

      if (response.ok) {
        const data: SearchData = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Full search error:", error);
    } finally {
      setLoading(false);
    }
  }, [query, eventPage, userPage, resultsPerPage]);

  useEffect(() => {
    setEventPage(1);
    setUserPage(1);

    fetchResults();
  }, [query]);

  useEffect(() => {
    if (query) {
      fetchResults();
    }
  }, [eventPage, userPage, fetchResults, query]);

  const totalResults =
    results.events.pagination.totalItems + results.users.pagination.totalItems;

  if (loading) {
    return (
      <div className="container mt-5 search-loading">
        Loading search results for "{query}"...
      </div>
    );
  }

  return (
    <div className="container mt-5 search-container">
      <h2>Search Results for: "{query}"</h2>
      <hr className="search-separator" />
      {totalResults === 0 ? (
        <p className="alert alert-info search-alert">
          No events or users found matching "{query}".
        </p>
      ) : (
        <p className="text-muted search-found-text">
          Found {results.events.pagination.totalItems} event(s) and{" "}
          {results.users.pagination.totalItems} user(s).
        </p>
      )}
      <div className="row">
        {/* --- Events Column --- */}
        <div className="col-md-6">
          <h3 className="search-subheader">
            Events ({results.events.pagination.totalItems})
          </h3>
          {results.events.results.length === 0 && (
            <p className="text-muted">No events found on this page.</p>
          )}
          <ul className="list-group search-list-group">
            {results.events.results.map((event) => (
              <li
                key={event.id}
                className="list-group-item d-flex justify-content-between align-items-center search-list-item"
              >
                <Link
                  to={`/event/${event.id}`}
                  className="text-primary search-event-link"
                >
                  {event.title}
                </Link>
                <small className="text-muted search-small-text">
                  {format(new Date(event.event_datetime), "MMM dd, yyyy @ p")}
                </small>
              </li>
            ))}
          </ul>
          {/* Events Pagination */}
          {results.events.pagination.totalPages > 1 && (
            <div className="mt-3 pagination-container">
              <PaginationControls
                currentPage={results.events.pagination.currentPage}
                totalPages={results.events.pagination.totalPages}
                onPageChange={setEventPage}
              />
            </div>
          )}
        </div>
        <div className="col-md-6">
          <h3 className="search-subheader">
            Users ({results.users.pagination.totalItems})
          </h3>
          {results.users.results.length === 0 && (
            <p className="text-muted">No users found on this page.</p>
          )}
          <ul className="list-group search-list-group">
            {results.users.results.map((user) => (
              <li key={user.id} className="list-group-item search-list-item">
                <Link
                  to={`/user/${user.username}`}
                  className="text-success search-user-link"
                >
                  {user.username}
                </Link>
              </li>
            ))}
          </ul>
          {results.users.pagination.totalPages > 1 && (
            <div className="mt-3 pagination-container">
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
