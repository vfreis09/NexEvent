import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";

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

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<{
    events: EventResult[];
    users: UserResult[];
  }>({ events: [], users: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setResults({ events: [], users: [] });
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/search?q=${query}`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Full search error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="container mt-5">
        Loading search results for "{query}"...
      </div>
    );
  }

  const totalResults = results.events.length + results.users.length;

  return (
    <div className="container mt-5">
      <h2>Search Results for: "{query}"</h2>
      <hr />
      {totalResults === 0 ? (
        <p className="alert alert-info">
          No events or users found matching "{query}".
        </p>
      ) : (
        <p className="text-muted">Found {totalResults} result(s).</p>
      )}
      <div className="row">
        <div className="col-md-6">
          <h3>Events ({results.events.length})</h3>
          <ul className="list-group">
            {results.events.map((event) => (
              <li
                key={event.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <Link to={`/event/${event.id}`} className="text-primary">
                  {event.title}
                </Link>
                <small className="text-muted">
                  {format(new Date(event.event_datetime), "MMM dd, yyyy @ p")}
                </small>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <h3>Users ({results.users.length})</h3>
          <ul className="list-group">
            {results.users.map((user) => (
              <li key={user.id} className="list-group-item">
                <Link to={`/user/${user.username}`} className="text-success">
                  {user.username}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
