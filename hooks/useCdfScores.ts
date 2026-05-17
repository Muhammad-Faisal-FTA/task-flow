// hooks/useCdfScores.ts
"use client";

import {
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import type { CdfScoreDTO, CdfEventGroup } from "@/types/cdf";

interface UseCdfScoresReturn {
  scores:     CdfScoreDTO | null;
  events:     CdfEventGroup[];
  isLoading:  boolean;
  hasData:    boolean;
  refresh:    () => Promise<void>;
}

export function useCdfScores(): UseCdfScoresReturn {
  const { getAccessToken } = useAuth();
  const [scores,    setScores]    = useState<CdfScoreDTO | null>(null);
  const [events,    setEvents]    = useState<CdfEventGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch scores + events in parallel
      const [scoresRes, eventsRes] = await Promise.all([
        fetch("/api/cdf/scores",  { headers }),
        fetch("/api/cdf/events",  { headers }),
      ]);

      if (scoresRes.ok) {
        const data = await scoresRes.json();
        setScores(data.data ?? null);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.data ?? []);
      }
    } catch (err) {
      console.error("[useCdfScores] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    scores,
    events,
    isLoading,
    hasData:  scores !== null,
    refresh,
  };
}
