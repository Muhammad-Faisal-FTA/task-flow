// hooks/useAppApiClient.ts
"use client";
import { useState, useCallback, useEffect } from "react";
import { taskApi, listApi, setTokenGetter } from "@/services/apiService";
import {
  cacheTasks,
  cacheLists,
  getCachedTasks,
  getCachedLists,
  getCacheAge,
} from "@/lib/taskCache";

import type {
  TaskDTO,
  TaskListDTO,
  GroupedTasks,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types/task";
import type { Task, TaskList } from "@/types";

// ─── Converters ───────────────────────────────────────────────────────────────
function taskDtoToUi(dto: TaskDTO): Task {
  return {
    id:            dto.id,
    title:         dto.title,
    listId:        dto.listId,
    completed:     dto.completed,
    dueDate:       dto.dueDate,
    dueTime:       dto.dueTime,
    repeat:        dto.repeat,
    status:        dto.status,        // ← keep exact status from API
    hasRepeatIcon: dto.repeat !== "none",
    links:         dto.links??[],         // ← pass through links from API
  };
}

function listDtoToUi(dto: TaskListDTO): TaskList {
  return {
    id:           dto.id,
    name:         dto.name,
    color:        dto.color,
    taskCount:    dto.taskCount,
    overdueCount: dto.overdueCount,
  };
}

function isGroupedTasks(
  data: GroupedTasks | TaskDTO[]
): data is GroupedTasks {
  return !Array.isArray(data) && "overdue" in data;
}

// Flatten grouped → flat array preserving STATUS_ORDER
function flattenGrouped(grouped: GroupedTasks): TaskDTO[] {
  return [
    ...grouped.overdue,
    ...grouped.today,
    ...grouped.tomorrow,
    ...grouped.next_week,
    ...grouped.future,
    ...grouped.nodate,
  ];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppApiClient(
  getAccessToken: () => Promise<string | null> | string | null
) {
  useEffect(() => {
    setTokenGetter(getAccessToken);
  }, [getAccessToken]);
  
  const [isFromCache, setIsFromCache] = useState(false);
  const [screen, setScreen]               = useState<"home" | "detail" | "lists">("home");
  const [screenHistory, setScreenHistory] = useState<("home" | "detail" | "lists")[]>([]);
  const [tasks,    setTasks]              = useState<Task[]>([]);
  const [lists,    setLists]              = useState<TaskList[]>([]);
  const [selectedTask, setSelectedTask]   = useState<Task | null>(null);
  const [filterListId, setFilterListId]   = useState<string | null>(null);
  const [toast,    setToast]              = useState<string | null>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [error,    setError]              = useState<string | null>(null);
  // ─── Add undo state ───────────────────────────────────────────────────────────
// Add this near other useState declarations:
const [undoTask,    setUndoTask]    = useState<Task | null>(null);
const [undoTimeout, setUndoTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async (params?: { listId?: string }) => {
    // setIsLoading(true);
    // setError(null);
    if (typeof window !== "undefined") {
    const cached = await getCachedTasks();
    if (cached.length > 0) {
      setTasks(cached.map(taskDtoToUi));
      setIsFromCache(true);
      setIsLoading(false);    // show UI immediately
    } else {
      setIsLoading(true);     // no cache — show spinner
    }
  }
    // Step 2 — Fetch fresh from API in background
  setError(null);
  try {
    const data = await taskApi.getTasks({
      listId:           params?.listId ?? filterListId ?? undefined,
      grouped:          true,
      includeCompleted: false,
    });

    const dtos: TaskDTO[] = isGroupedTasks(data)
      ? flattenGrouped(data)
      : data;

    setTasks(dtos.map(taskDtoToUi));
    setIsFromCache(false);

        await cacheTasks(dtos);

    } catch (err) {
      const e = err as { message?: string };
    // Only set error if we have no cached data to show
    if (tasks.length === 0) {
      setError(e.message ?? "Failed to fetch tasks");
    }
    console.error("[fetchTasks]", err);
    } finally {
    setIsLoading(false);
  }
}, [filterListId, tasks.length]);


  // ── Fetch lists ────────────────────────────────────────────────────────────
  const fetchLists = useCallback(async () => {
    //  Step 1 — Load from IndexedDB instantly
  if (typeof window !== "undefined") {
    const cached = await getCachedLists();
    if (cached.length > 0) {
      setLists(cached.map(listDtoToUi));
    }
  }
    // Step 2 — Fetch fresh in background
  setError(null);
  try {
    const data = await listApi.getLists();
    setLists(data.map(listDtoToUi));
    await cacheLists(data);   // update cache
  } catch (err) {
    const e = err as { message?: string };
    if (lists.length === 0) {
      setError(e.message ?? "Failed to fetch lists");
    }
    console.error("[fetchLists]", err);

  }finally {
      setIsLoading(false);
    }
}, [lists.length])
 
 

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchTasks(), fetchLists()]);
  }, [fetchTasks, fetchLists]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = useCallback((to: "home" | "detail" | "lists") => {
    setScreenHistory(prev => [...prev, screen]);
    setScreen(to);
  }, [screen]);

  const goBack = useCallback(() => {
    setScreenHistory(prev => {
      const copy = [...prev];
      setScreen(copy.pop() ?? "home");
      return copy;
    });
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback(async (id: string | null) => {
    setFilterListId(id);
    // Re-fetch with new filter
    setIsLoading(true);
    try {
      const data = await taskApi.getTasks({
        listId:           id ?? undefined,
        grouped:          true,
        includeCompleted: false,
      });
      const dtos: TaskDTO[] = isGroupedTasks(data)
        ? flattenGrouped(data)
        : data;
      setTasks(dtos.map(taskDtoToUi));
    } catch (err) {
      console.error("[filterChange]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Toggle complete ────────────────────────────────────────────────────────
  const toggleComplete = useCallback(async (id: string) => {
    // Optimistic
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
    try {
      await taskApi.toggleTask(id);
      // Refresh to get correct status after toggle
      await fetchTasks();
    } catch (err) {
      // Revert
      setTasks(prev =>
        prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      );
      const e = err as { message?: string };
      showToast(e.message ?? "Failed to update task");
    }
  }, [fetchTasks, showToast]);

  // ── Open / new task ────────────────────────────────────────────────────────
  const openTask = useCallback((task: Task) => {
    setSelectedTask({ ...task });
    navigate("detail");
  }, [navigate]);

  const openNewTask = useCallback(() => {
    setSelectedTask({
      id:            "",
      title:         "",
      listId:        lists[0]?.id ?? "",
      completed:     false,
      dueDate:       null,
      dueTime:       null,
      repeat:        "none",
      status:        "nodate",
      hasRepeatIcon: false,
      links:         [],
    });
    navigate("detail");
  }, [lists, navigate]);

  // ── Save task ──────────────────────────────────────────────────────────────
  const saveTask = useCallback(async (
    taskInput: Omit<Task, "id" | "status" | "hasRepeatIcon"> & { id?: string }
  ): Promise<boolean> => {
    if (!taskInput.title.trim()) return false;

    setIsLoading(true);
    try {
      if (taskInput.id) {
        // Update
        await taskApi.updateTask(taskInput.id, {
          title:     taskInput.title,
          listId:    taskInput.listId,
          dueDate:   taskInput.dueDate,
          dueTime:   taskInput.dueTime,
          repeat:    taskInput.repeat,
          completed: taskInput.completed,
        });
        showToast("Task updated ✓");
      } else {
        // Create
        await taskApi.createTask({
          title:   taskInput.title,
          listId:  taskInput.listId,
          dueDate: taskInput.dueDate,
          dueTime: taskInput.dueTime,
          repeat:  taskInput.repeat,
        });
        showToast("Task added ✓");
      }

      await fetchTasks();  // refresh with correct status
      goBack();
      return true;
    } catch (err) {
      const e = err as { message?: string };
      showToast(e.message ?? "Failed to save task");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTasks, goBack, showToast]);

  // ─── Undo delete ──────────────────────────────────────────────────────────────
const undoDelete = useCallback(async () => {
  if (!undoTask) return;

  const taskToRestore = undoTask;

  // Clear undo state immediately
  setUndoTask(null);
  setUndoTimeout(prev => { if (prev) clearTimeout(prev); return null; });

  try {
    await taskApi.restoreTask(taskToRestore.id);
    // Re-add to local state optimistically
    setTasks(prev => [...prev, taskToRestore]);
    showToast("Task restored ✓");
  } catch (err) {
    const e = err as { message?: string };
    showToast(e.message ?? "Failed to restore task");
  }
}, [undoTask, showToast]);
 // ─── Updated deleteTask ───────────────────────────────────────────────────────
const deleteTask = useCallback(async (id: string) => {
  const backup = tasks.find(t => t.id === id);

  // Optimistic removal
  setTasks(prev => prev.filter(t => t.id !== id));

  try {
    await taskApi.deleteTask(id);

    // Store backup for undo — 5 second window
    if (backup) {
      setUndoTask(backup);

      // Clear any existing undo timeout
      setUndoTimeout(prev => {
        if (prev) clearTimeout(prev);
        return setTimeout(() => {
          setUndoTask(null);
        }, 5000);
      });
    }

    showToast("Task deleted");
  } catch (err) {
    // Revert on failure
    if (backup) setTasks(prev => [...prev, backup]);
    const e = err as { message?: string };
    showToast(e.message ?? "Failed to delete task");
  }

  goBack();
}, [tasks, goBack, showToast]);

  // ── List actions ───────────────────────────────────────────────────────────
  const addList = useCallback(async (name: string, color: string) => {
    try {
      const newList = await listApi.createList({ name, color });
      setLists(prev => [...prev, listDtoToUi(newList)]);
      showToast(`"${name}" created`);
    } catch (err) {
      const e = err as { message?: string };
      showToast(e.message ?? "Failed to create list");
    }
  }, [showToast]);

  const deleteList = useCallback(async (id: string) => {
    const backup = lists.find(l => l.id === id);
    setLists(prev => prev.filter(l => l.id !== id));
    setTasks(prev => prev.filter(t => t.listId !== id));

    try {
      await listApi.deleteList(id);
      showToast("List deleted");
    } catch (err) {
      if (backup) setLists(prev => [...prev, backup]);
      const e = err as { message?: string };
      showToast(e.message ?? "Failed to delete list");
    }
  }, [lists, showToast]);

 // ── Filtered tasks ─────────────────────────────────────────────────────────
  // Added to useAppApiClient.ts — after addList

const updateList = useCallback(async (
  id: string,
  data: { name?: string; color?: string }
) => {
  // Optimistic update
  setLists(prev =>
    prev.map(l => l.id === id ? { ...l, ...data } : l)
  );

  try {
    await listApi.updateList(id, data);
    showToast("List updated ✓");
  } catch (err) {
    // Revert
    await fetchLists();
    const e = err as { message?: string };
    showToast(e.message ?? "Failed to update list");
  }
}, [fetchLists, showToast]);

  // ── Filtered tasks ─────────────────────────────────────────────────────────
  const filteredTasks = filterListId
    ? tasks.filter(t => t.listId === filterListId)
    : tasks;

  return {
    screen,
    tasks:       filteredTasks,
    allTasks:    tasks,
    lists,
    filterListId,
    setFilterListId: handleFilterChange,  // ← uses API filter now
    selectedTask,
    setSelectedTask,
    toast,
    isLoading,
    error,
    navigate,
    goBack,
    openTask,
    openNewTask,
    saveTask,
    deleteTask,
    undoDelete,
    undoTask,     // ← new undo function  
    toggleComplete,
    addList,
    deleteList,
    showToast,
    fetchTasks,
    fetchLists,
    refreshAll,
    updateList,  // ← new API-integrated list update
    isFromCache, // ← indicates if tasks are from cache (for UI hints) 

  };
}

export type AppApiClientState = ReturnType<typeof useAppApiClient>;