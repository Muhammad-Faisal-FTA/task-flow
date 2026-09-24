// hooks/useOfflineSync.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { taskApi } from "@/services/apiService";
import {
  getPendingActions,
  removePendingAction,
} from "@/lib/taskCache";

interface UseOfflineSyncReturn {
  isOnline:    boolean;
  isSyncing:   boolean;
  pendingCount: number;
}

export function useOfflineSync(
  onSyncComplete?: () => void
): UseOfflineSyncReturn {
  const [isOnline,     setIsOnline]     = useState(true);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // ── Count pending queue items ─────────────────────────────────────────────
  const countPending = useCallback(async () => {
    try {
      setPendingCount((await getPendingActions()).length);
    } catch { /* ignore */ }
  }, []);

  const syncPendingActions = useCallback(async () => {
    const actions = (await getPendingActions()).sort(
      (left, right) => left.createdAt - right.createdAt,
    );
    if (actions.length === 0) return;

    setIsSyncing(true);
    const syncedIds = new Map<string, string>();
    for (const action of actions) {
      try {
        if (action.type === "create-task") {
          const created = await taskApi.createTask({
            title: String(action.payload.title ?? ""),
            listId: String(action.payload.listId ?? ""),
            dueDate: (action.payload.dueDate as string | null | undefined) ?? null,
            dueTime: (action.payload.dueTime as string | null | undefined) ?? null,
            repeat: action.payload.repeat as "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly" | undefined,
          });
          if (action.entityId) syncedIds.set(action.entityId, created.id);
        } else if (action.type === "update-task" && action.entityId) {
          const taskId = syncedIds.get(action.entityId) ?? action.entityId;
          await taskApi.updateTask(taskId, {
            title: String(action.payload.title ?? ""),
            listId: String(action.payload.listId ?? ""),
            dueDate: (action.payload.dueDate as string | null | undefined) ?? null,
            dueTime: (action.payload.dueTime as string | null | undefined) ?? null,
            repeat: action.payload.repeat as "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly" | undefined,
            completed: Boolean(action.payload.completed),
          });
        } else {
          continue;
        }
        await removePendingAction(action.id);
      } catch {
        // Keep failed actions queued for the next online attempt.
      }
    }

    await countPending();
    setIsSyncing(false);
    onSyncComplete?.();
  }, [countPending, onSyncComplete]);

  useEffect(() => {
    countPending();

    // Online handler — tell SW to flush queue
    const handleOnline = () => {
      setIsOnline(true);
      void syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // SW message handler — sync complete
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        setIsSyncing(false);
        setPendingCount(0);
        onSyncComplete?.();
      }
    };

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
    };
  }, [countPending, onSyncComplete, syncPendingActions]);

  useEffect(() => {
    // Initialize online state
    setIsOnline(navigator.onLine);
  }, []);

  return { isOnline, isSyncing, pendingCount };
}