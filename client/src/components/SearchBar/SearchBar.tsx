import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SearchType } from "../../types/SearchType";
import "./SearchBar.css"; // Import the new CSS file

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{
    events: SearchType[];
    users: SearchType[];
  }>({ events: [], users: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions({ events: [], users: [] });
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/search?q=${query}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error("Search suggestion error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSuggestions({ events: [], users: [] });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search/results?q=${query.trim()}`);
      setSuggestions({ events: [], users: [] });
    }
  };

  const handleSuggestionClick = (
    type: "event" | "user",
    id: number,
    username?: string
  ) => {
    if (type === "event") {
      navigate(`/event/${id}`);
    } else if (type === "user" && username) {
      navigate(`/user/${username}`);
    }
    setSuggestions({ events: [], users: [] });
    setQuery("");
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasSuggestions =
    suggestions.events.length > 0 || suggestions.users.length > 0;

  return (
    <div className="search-bar-container" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="d-flex position-relative">
        <input
          type="search"
          className="form-control me-2"
          placeholder="Search events or users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-outline-success">
          Search
        </button>
      </form>
      {hasSuggestions && (
        <div className="suggestions-dropdown search-dropdown-base bg-white shadow rounded mt-1 p-2">
          {suggestions.events.length > 0 && (
            <>
              <h6 className="suggestion-category">Events</h6>
              <ul className="list-unstyled">
                {suggestions.events.map((item) => (
                  <li
                    key={`event-${item.id}`}
                    onClick={() => handleSuggestionClick("event", item.id)}
                    className="suggestion-item p-1 suggestion-item-base"
                  >
                    <strong>{item.title}</strong>
                    <small className="text-muted ms-2 suggestion-date">
                      ({formatEventDate(item.event_datetime!)})
                    </small>
                  </li>
                ))}
              </ul>
            </>
          )}
          {suggestions.users.length > 0 && (
            <>
              <h6 className="suggestion-category">Users</h6>
              <ul className="list-unstyled">
                {suggestions.users.map((item) => (
                  <li
                    key={`user-${item.id}`}
                    onClick={() =>
                      handleSuggestionClick("user", item.id, item.username)
                    }
                    className="suggestion-item p-1 suggestion-item-base"
                  >
                    {item.username}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {loading && query.length >= 2 && (
        <div className="suggestions-dropdown search-dropdown-base bg-white shadow rounded mt-1 p-2">
          <p className="text-muted mb-0">Loading...</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
