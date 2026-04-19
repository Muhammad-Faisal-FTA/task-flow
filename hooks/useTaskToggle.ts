// hooks/useTaskToggle.ts
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { TaskDTO } from "@/types/task";

interface UseTaskToggleOptions {
  onSuccess?: (task: TaskDTO) => void;
  onError?:   (message: string) => void;
}

interface UseTaskToggleReturn {
  toggle:      (taskId: string) => Promise<void>;
  isToggling:  (taskId: string) => boolean;
}

export function useTaskToggle(
  options: UseTaskToggleOptions = {}
): UseTaskToggleReturn {
  const { onSuccess, onError } = options;
  const { getAccessToken }     = useAuth();

  // Track which tasks are currently being toggled
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const isToggling = useCallback(
    (taskId: string) => togglingIds.has(taskId),
    [togglingIds]
  );

  const toggle = useCallback(async (taskId: string) => {
    // Prevent double-toggle
    if (togglingIds.has(taskId)) return;

    setTogglingIds(prev => new Set(prev).add(taskId));

    try {
      const token = await getAccessToken();
      if (!token) {
        onError?.("Session expired. Please log in again.");
        return;
      }

      const res = await fetch(`/api/tasks/${taskId}`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ toggle: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError?.(data.error ?? "Failed to update task.");
        return;
      }

      onSuccess?.(data.data as TaskDTO);
    } catch {
      onError?.("Something went wrong. Please try again.");
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [togglingIds, getAccessToken, onSuccess, onError]);

  return { toggle, isToggling };
}