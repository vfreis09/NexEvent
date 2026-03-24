import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { SearchType } from "../../types/SearchType";
import { useTheme } from "../../context/ThemeContext";
import Loading from "../../components/Loading/Loading";
import "./SearchBar.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

interface SearchFormData {
  query: string;
}

const SearchBar: React.FC = () => {
  const [suggestions, setSuggestions] = useState<{
    events: SearchType[];
    users: SearchType[];
  }>({ events: [], users: [] });
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, control } = useForm<SearchFormData>({
    defaultValues: { query: "" },
  });

  const query = useWatch({ control, name: "query", defaultValue: "" });

  useEffect(() => {
    const controller = new AbortController();

    if (query.length < 2) {
      setSuggestions({ events: [], users: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${BASE_URL}/search?q=${query}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setSuggestions({
            events: (Array.isArray(data.events)
              ? data.events
              : data.events?.results || []) as SearchType[],
            users: (Array.isArray(data.users)
              ? data.users
              : data.users?.results || []) as SearchType[],
          });
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Search suggestion error:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
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

  const onSearchSubmit = (data: SearchFormData) => {
    if (data.query.trim()) {
      navigate(`/search/results?q=${data.query.trim()}`);
      setSuggestions({ events: [], users: [] });
    }
  };

  const handleSuggestionClick = (
    type: "event" | "user",
    id: number,
    username?: string,
  ) => {
    if (type === "event") navigate(`/event/${id}`);
    else if (type === "user" && username) navigate(`/user/${username}`);
    setSuggestions({ events: [], users: [] });
    reset();
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
    <div
      className={`search-bar-container ${theme === "dark" ? "dark-mode" : ""}`}
      ref={searchRef}
    >
      <form
        onSubmit={handleSubmit(onSearchSubmit)}
        className="d-flex position-relative"
      >
        <input
          type="search"
          className="form-control me-2"
          placeholder="Search events or users..."
          {...register("query")}
        />
        <button type="submit" className="btn btn-outline-primary">
          Search
        </button>
      </form>
      {(hasSuggestions || (loading && query.length >= 2)) && (
        <div className="suggestions-dropdown search-dropdown-base shadow rounded mt-1 p-2">
          {loading && (
            <div className="p-1 border-bottom mb-1 d-flex justify-content-center">
              <Loading variant="spinner" />
            </div>
          )}
          {suggestions.events.length > 0 && (
            <div className="mb-2">
              <h6 className="suggestion-category">Events</h6>
              <ul className="list-unstyled mb-0">
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
            </div>
          )}
          {suggestions.users.length > 0 && (
            <div>
              <h6 className="suggestion-category">Users</h6>
              <ul className="list-unstyled mb-0">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
