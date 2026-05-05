// // hooks/useTaskToggle.ts
// "use client";

// import { useState, useCallback } from "react";
// import { useAuth } from "@/hooks/useAuth";
// import type { TaskDTO } from "@/types/task";

// interface UseTaskToggleOptions {
//   onSuccess?: (task: TaskDTO) => void;
//   onError?:   (message: string) => void;
// }

// interface UseTaskToggleReturn {
//   toggle:      (taskId: string) => Promise<void>;
//   isToggling:  (taskId: string) => boolean;
// }

// export function useTaskToggle(
//   options: UseTaskToggleOptions = {}
// ): UseTaskToggleReturn {
//   const { onSuccess, onError } = options;
//   const { getAccessToken }     = useAuth();

//   // Track which tasks are currently being toggled
//   const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

//   const isToggling = useCallback(
//     (taskId: string) => togglingIds.has(taskId),
//     [togglingIds]
//   );

//   const toggle = useCallback(async (taskId: string) => {
//     // Prevent double-toggle
//     if (togglingIds.has(taskId)) return;

//     setTogglingIds(prev => new Set(prev).add(taskId));

//     try {
//       const token = await getAccessToken();
//       if (!token) {
//         onError?.("Session expired. Please log in again.");
//         return;
//       }

//       const res = await fetch(`/api/tasks/${taskId}`, {
//         method:  "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization:  `Bearer ${token}`,
//         },
//         body: JSON.stringify({ toggle: true }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         onError?.(data.error ?? "Failed to update task.");
//         return;
//       }

//       onSuccess?.(data.data as TaskDTO);
//     } catch {
//       onError?.("Something went wrong. Please try again.");
//     } finally {
//       setTogglingIds(prev => {
//         const next = new Set(prev);
//         next.delete(taskId);
//         return next;
//       });
//     }
//   }, [togglingIds, getAccessToken, onSuccess, onError]);

//   return { toggle, isToggling };
// }




// hooks/useTaskToggle.ts
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { TaskDTO } from "@/types/task";
import type { CdfEventDTO } from "@/types/cdf";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseTaskToggleOptions {
  onSuccess?:       (task: TaskDTO) => void;
  onError?:         (message: string) => void;
  // CDF callbacks
  onCdfEvent?:      (event: CdfEventDTO, taskTitle: string) => void;
  isCdfEnabled?:    boolean;
}

interface UseTaskToggleReturn {
  toggle:     (taskId: string) => Promise<void>;
  isToggling: (taskId: string) => boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTaskToggle(
  options: UseTaskToggleOptions = {}
): UseTaskToggleReturn {
  const { onSuccess, onError, onCdfEvent, isCdfEnabled } = options;
  const { getAccessToken } = useAuth();

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const isToggling = useCallback(
    (taskId: string) => togglingIds.has(taskId),
    [togglingIds]
  );

  const toggle = useCallback(async (taskId: string) => {
    if (togglingIds.has(taskId)) return;

    setTogglingIds(prev => new Set(prev).add(taskId));

    try {
      const token = await getAccessToken();
      if (!token) {
        onError?.("Session expired. Please log in again.");
        return;
      }

      // 1. Toggle task completion
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

      const task = data.data as TaskDTO;
      onSuccess?.(task);

      // 2. If task was just COMPLETED (not uncompleted) + CDF enabled
      //    → create CDF event
      if (task.completed && isCdfEnabled) {
        try {
          const cdfRes = await fetch("/api/cdf/events", {
            method:  "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:  `Bearer ${token}`,
            },
            body: JSON.stringify({
              taskId:    task.id,
              taskTitle: task.title,
              listId:    task.listId,
              repeat:    task.repeat,
              dueDate:   task.dueDate   ?? null,
              dueTime:   task.dueTime   ?? null,
            }),
          });

          if (cdfRes.ok) {
            const cdfData = await cdfRes.json();
            // Trigger focus popup via callback
            onCdfEvent?.(cdfData.data as CdfEventDTO, task.title);
          }
        } catch (cdfErr) {
          // CDF failure should never block task completion
          console.error("[CDF] Failed to create event:", cdfErr);
        }
      }
    } catch {
      onError?.("Something went wrong. Please try again.");
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [togglingIds, getAccessToken, onSuccess, onError, onCdfEvent, isCdfEnabled]);

  return { toggle, isToggling };
}