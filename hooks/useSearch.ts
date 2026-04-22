// hooks/useSearch.ts
"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import type { TaskDTO } from "@/types/task";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseSearchReturn {
  query:        string;
  setQuery:     (q: string) => void;
  results:      TaskDTO[];
  isSearching:  boolean;
  hasSearched:  boolean;
  clear:        () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSearch(debounceMs = 350): UseSearchReturn {
  const { getAccessToken }  = useAuth();
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<TaskDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Abort controller — cancels previous in-flight request
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();

    // Clear results if empty query
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsSearching(true);

    try {
      const token = await getAccessToken();
      if (!token) return;

      const url = `/api/tasks?search=${encodeURIComponent(trimmed)}&grouped=false&includeCompleted=false`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal:  abortRef.current.signal,
      });

      if (!res.ok) return;

      const data = await res.json();

      // API returns { data: TaskDTO[] } when grouped=false
      const tasks: TaskDTO[] = Array.isArray(data.data)
        ? data.data
        : [];

      setResults(tasks);
      setHasSearched(true);
    } catch (err: unknown) {
      // Ignore abort errors — expected when query changes fast
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[useSearch]", err);
    } finally {
      setIsSearching(false);
    }
  }, [getAccessToken]);

  // Debounce — cancel previous timer on every keystroke
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setIsSearching(false);
    abortRef.current?.abort();
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    hasSearched,
    clear,
  };
}