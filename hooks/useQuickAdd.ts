// hooks/useQuickAdd.ts
"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import type { TaskDTO, TaskListDTO } from "@/types/task";
import { createPendingAction } from "@/lib/offlineActions";
import {
  cacheTasks,
  enqueuePendingAction,
  getCachedLists,
  getCachedTasks,
} from "@/lib/taskCache";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseQuickAddOptions {
  // Called after task is successfully created
  onSuccess?: (task: TaskDTO) => void;
  // Called on error
  onError?: (message: string) => void;
}

interface UseQuickAddReturn {
  value:        string;
  setValue:     (v: string) => void;
  isSubmitting: boolean;
  isLoading:    boolean;    // loading default list
  submit:       () => Promise<void>;
  clear:        () => void;
  defaultList:  TaskListDTO | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useQuickAdd(
  options: UseQuickAddOptions = {}
): UseQuickAddReturn {
  const { onSuccess, onError } = options;
  const { getAccessToken }     = useAuth();

  const [value,        setValue]        = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);
  const [defaultList,  setDefaultList]  = useState<TaskListDTO | null>(null);

  // Stable ref — avoids stale closure in submit
  const defaultListRef = useRef<TaskListDTO | null>(null);

  // ── Fetch default list on mount ───────────────────────────────────────────
  useEffect(() => {
    async function fetchDefaultList() {
      try {
        setIsLoading(true);
        const cachedLists = await getCachedLists();
        const cachedDefault = cachedLists.find((l) => l.isDefault) ?? cachedLists[0] ?? null;
        if (cachedDefault) {
          setDefaultList(cachedDefault);
          defaultListRef.current = cachedDefault;
        }

        if (typeof navigator !== "undefined" && !navigator.onLine) return;

        const token = await getAccessToken();
        if (!token) return;

        const res = await fetch("/api/lists", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json() as { data: TaskListDTO[] };
        const def  = data.data.find((l) => l.isDefault) ?? data.data[0] ?? null;

        setDefaultList(def);
        defaultListRef.current = def;
      } catch (err) {
        console.error("[useQuickAdd] Failed to fetch default list:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDefaultList();
  }, [getAccessToken]);

  // ── Clear input ───────────────────────────────────────────────────────────
  const clear = useCallback(() => setValue(""), []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    const title = value.trim();

    // Guard: empty input
    if (!title) return;

    // Guard: no list available
    const list = defaultListRef.current;
    if (!list) {
      onError?.("No list available. Please create a list first.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();
        const localTask: TaskDTO = {
          id: localId,
          userId: "",
          listId: list.id,
          title,
          completed: false,
          completedAt: null,
          dueDate: null,
          dueTime: null,
          repeat: "none",
          status: "nodate",
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
          links: [],
        };
        const cachedTasks = await getCachedTasks();
        await cacheTasks([localTask, ...cachedTasks]);
        await enqueuePendingAction(
          createPendingAction(
            "create-task",
            { title, listId: list.id, dueDate: null, dueTime: null, repeat: "none" },
            localId,
          ),
        );
        clear();
        onSuccess?.(localTask);
        onError?.("Saved locally — will sync when online");
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        onError?.("Session expired. Please log in again.");
        return;
      }

      const res = await fetch("/api/tasks", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          listId:  list.id,
          dueDate: null,
          dueTime: null,
          repeat:  "none",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError?.(data.error ?? "Failed to create task.");
        return;
      }

      // Clear input on success
      clear();
      onSuccess?.(data.data as TaskDTO);
    } catch {
      onError?.("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [value, getAccessToken, clear, onSuccess, onError]);

  return {
    value,
    setValue,
    isSubmitting,
    isLoading,
    submit,
    clear,
    defaultList,
  };
}