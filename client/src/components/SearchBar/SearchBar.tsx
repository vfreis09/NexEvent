import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { Search } from "lucide-react";
import { SearchType } from "../../types/SearchType";
import Loading from "../../components/Loading/Loading";
import { Input } from "@/components/ui/input";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

interface SearchFormData {
  query: string;
}

const SearchBar: React.FC = () => {
  const [suggestions, setSuggestions] = useState<{
    events: SearchType[];
    users: SearchType[];
  }>({ events: [], users: [] });
  const [loading, setLoading] = useState(false);
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
    });
  };

  const hasSuggestions =
    suggestions.events.length > 0 || suggestions.users.length > 0;

  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSubmit(onSearchSubmit)} className="relative flex items-center w-full">
        <Search size={16} className="absolute left-3.5 text-muted-foreground pointer-events-none z-10" />
        
        <Input
          type="text"
          placeholder="Search events or users..."
          {...register("query")}
          className="w-full !pl-11 pr-4 !h-11 border-border bg-muted/30 text-foreground !text-sm focus-visible:ring-2 focus-visible:ring-primary placeholder:text-muted-foreground !rounded-lg font-mono transition-colors"
        />
        <button type="submit" className="hidden">Search</button>
      </form>

      {(hasSuggestions || (loading && query.length >= 2)) && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-lg border border-border bg-card p-2 shadow-xl max-h-80 overflow-y-auto">
          {loading && (
            <div className="mb-2 flex justify-center py-2 border-b border-border/50">
              <Loading variant="spinner" />
            </div>
          )}

          {suggestions.events.length > 0 && (
            <div className="mb-2">
              <h6 className="mb-1 px-2 py-1 text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                // Events
              </h6>
              <ul className="space-y-0.5 p-0 m-0 list-none">
                {suggestions.events.map((item) => (
                  <li
                    key={`event-${item.id}`}
                    onClick={() => handleSuggestionClick("event", item.id)}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted/50 flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="font-medium truncate">{item.title}</span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {formatEventDate(item.event_datetime!)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.users.length > 0 && (
            <div>
              <h6 className="mb-1 px-2 py-1 text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                // Users
              </h6>
              <ul className="space-y-0.5 p-0 m-0 list-none">
                {suggestions.users.map((item) => (
                  <li
                    key={`user-${item.id}`}
                    onClick={() =>
                      handleSuggestionClick("user", item.id, item.username)
                    }
                    className="cursor-pointer rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors font-mono"
                  >
                    @{item.username}
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