// hooks/useCdfSettings.ts
"use client";

import {
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import type { CdfSettingsDTO } from "@/types/cdf";

interface UseCdfSettingsReturn {
  enabled:    boolean;
  isLoading:  boolean;
  isUpdating: boolean;
  toggle:     () => Promise<void>;
  refresh:    () => Promise<void>;
}

export function useCdfSettings(): UseCdfSettingsReturn {
  const { getAccessToken }    = useAuth();
  const [enabled,    setEnabled]    = useState(false);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // ── Fetch settings ─────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      const res  = await fetch("/api/cdf/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json() as { data: CdfSettingsDTO };
      setEnabled(data.data.enabled);
    } catch (err) {
      console.error("[useCdfSettings] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  // Fetch on mount
  useEffect(() => { refresh(); }, [refresh]);

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const toggle = useCallback(async () => {
    if (isUpdating) return;

    const next = !enabled;

    // Optimistic update
    setEnabled(next);
    setIsUpdating(true);

    try {
      const token = await getAccessToken();
      if (!token) { setEnabled(!next); return; }

      const res = await fetch("/api/cdf/settings", {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: next }),
      });

      if (!res.ok) {
        // Revert on failure
        setEnabled(!next);
      }
    } catch (err) {
      setEnabled(!next);
      console.error("[useCdfSettings] toggle error:", err);
    } finally {
      setIsUpdating(false);
    }
  }, [enabled, isUpdating, getAccessToken]);

  return { enabled, isLoading, isUpdating, toggle, refresh };
}
