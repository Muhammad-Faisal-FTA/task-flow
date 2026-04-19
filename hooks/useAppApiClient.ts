// // hooks/useAppApiClient.ts
// // API-integrated version of useAppState that uses axios-based API service

// "use client";
// import { useState, useCallback, useEffect } from "react";
// import { taskApi, listApi, setTokenGetter } from "@/services/apiService";
// import type { TaskDTO, TaskListDTO, GroupedTasks, CreateTaskInput, UpdateTaskInput, CreateListInput, UpdateListInput } from "@/types/task";
// import type { Task, TaskList } from "@/types";

// // ─── Converters: API DTO → UI Model ───────────────────────────────────────────

// function taskDtoToUi(dto: TaskDTO): Task {
//   return {
//     id: dto.id,
//     title: dto.title,
//     listId: dto.listId,
//     completed: dto.completed,
//     dueDate: dto.dueDate,
//     dueTime: dto.dueTime,
//     repeat: dto.repeat,
//     status: dto.status,
//     hasRepeatIcon: dto.repeat !== "none",
//   };
// }

// function listDtoToUi(dto: TaskListDTO): TaskList {
//   return {
//     id: dto.id,
//     name: dto.name,
//     color: dto.color,
//     taskCount: dto.taskCount,
//     overdueCount: dto.overdueCount,
//   };
// }

// // ─── Flatten grouped tasks ─────────────────────────────────────────────────────

// function flattenGroupedTasks(grouped: GroupedTasks): TaskDTO[] {
//   return [
//     ...grouped.overdue,
//     ...grouped.today,
//     ...grouped.tomorrow,
//     ...grouped.next_week,
//     ...grouped.future,
//     ...grouped.nodate,
//   ];
// }

// function isGroupedTasks(data: GroupedTasks | TaskDTO[]): data is GroupedTasks {
//   return !Array.isArray(data) && 'overdue' in data;
// }

// // ─── Main hook ─────────────────────────────────────────────────────────────────

// export function useAppApiClient(getAccessToken: () => Promise<string | null> | string | null) {
//   // Set token getter for axios interceptor
//   useEffect(() => {
//     setTokenGetter(getAccessToken);
//   }, [getAccessToken]);

//   const [screen, setScreen] = useState<"home" | "detail" | "lists">("home");
//   const [screenHistory, setScreenHistory] = useState<("home" | "detail" | "lists")[]>([]);
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [lists, setLists] = useState<TaskList[]>([]);
//   const [selectedTask, setSelectedTask] = useState<Task | null>(null);
//   const [filterListId, setFilterListId] = useState<string | null>(null);
//   const [toast, setToast] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // ─── Data fetching ───────────────────────────────────────────────────────────

//   const fetchTasks = useCallback(async (params?: { listId?: string }) => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const data = await taskApi.getTasks({
//         listId: params?.listId,
//         grouped: true,
//         includeCompleted: false,
//       });

//       let taskDtos: TaskDTO[];
//       if (isGroupedTasks(data)) {
//         taskDtos = flattenGroupedTasks(data);
//       } else {
//         taskDtos = data;
//       }

//       setTasks(taskDtos.map(taskDtoToUi));
//     } catch (err) {
//       const error = err as { message?: string };
//       setError(error.message ?? "Failed to fetch tasks");
//       console.error("Failed to fetch tasks:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   const fetchLists = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const data = await listApi.getLists();
//       setLists(data.map(listDtoToUi));
//     } catch (err) {
//       const error = err as { message?: string };
//       setError(error.message ?? "Failed to fetch lists");
//       console.error("Failed to fetch lists:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   const refreshAll = useCallback(async () => {
//     await Promise.all([fetchTasks(), fetchLists()]);
//   }, [fetchTasks, fetchLists]);

//   // ─── Navigation ──────────────────────────────────────────────────────────────

//   const navigate = useCallback((to: "home" | "detail" | "lists") => {
//     setScreenHistory(prev => [...prev, screen]);
//     setScreen(to);
//   }, [screen]);

//   const goBack = useCallback(() => {
//     setScreenHistory(prev => {
//       const copy = [...prev];
//       const last = copy.pop() ?? "home";
//       setScreen(last);
//       return copy;
//     });
//   }, []);

//   // ─── Toast ───────────────────────────────────────────────────────────────────

//   const showToast = useCallback((msg: string) => {
//     setToast(msg);
//     setTimeout(() => setToast(null), 2200);
//   }, []);

//   // ─── Task actions ────────────────────────────────────────────────────────────

//   const toggleComplete = useCallback(async (id: string) => {
//     // Optimistic update
//     setTasks(prev =>
//       prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
//     );

//     try {
//       await taskApi.toggleTask(id);
//     } catch (err) {
//       // Revert on failure
//       setTasks(prev =>
//         prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
//       );
//       const error = err as { message?: string };
//       showToast(error.message ?? "Failed to toggle task");
//       console.error("Failed to toggle task:", err);
//     }
//   }, [showToast]);

//   const openTask = useCallback((task: Task) => {
//     setSelectedTask({ ...task });
//     navigate("detail");
//   }, [navigate]);

//   const openNewTask = useCallback(() => {
//     const blank: Task = {
//       id: "",
//       title: "",
//       listId: lists[0]?.id ?? "",
//       completed: false,
//       dueDate: new Date().toISOString().split("T")[0],
//       dueTime: null,
//       repeat: "none",
//       status: "today",
//       hasRepeatIcon: false,
//     };
//     setSelectedTask(blank);
//     navigate("detail");
//   }, [lists, navigate]);

//   const saveTask = useCallback(async (taskInput: Omit<Task, "id" | "status" | "hasRepeatIcon"> & { id?: string }) => {
//     if (!taskInput.title.trim()) return false;

//     setIsLoading(true);
//     try {
//       const payload: CreateTaskInput | UpdateTaskInput = {
//         title: taskInput.title,
//         listId: taskInput.listId,
//         dueDate: taskInput.dueDate,
//         dueTime: taskInput.dueTime,
//         repeat: taskInput.repeat,
//       };

//       if (taskInput.id) {
//         // Update existing task
//         const updatedTask = await taskApi.updateTask(taskInput.id, payload);
//         setTasks(prev =>
//           prev.map(t => t.id === taskInput.id ? taskDtoToUi(updatedTask) : t)
//         );
//         showToast("Task updated ✓");
//       } else {
//         // Create new task
//         const newTask = await taskApi.createTask(payload as CreateTaskInput);
//         setTasks(prev => [...prev, taskDtoToUi(newTask)]);
//         showToast("Task added ✓");
//       }

//       goBack();
//       return true;
//     } catch (err) {
//       const error = err as { message?: string };
//       showToast(error.message ?? "Failed to save task");
//       console.error("Failed to save task:", err);
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   }, [goBack, showToast]);

//   const deleteTask = useCallback(async (id: string) => {
//     // Optimistic update
//     const deletedTask = tasks.find(t => t.id === id);
//     setTasks(prev => prev.filter(t => t.id !== id));

//     try {
//       const result = await taskApi.deleteTask(id);
//       showToast(result.message ?? "Task deleted");
//     } catch (err) {
//       // Revert on failure
//       if (deletedTask) {
//         setTasks(prev => [...prev, deletedTask]);
//       }
//       const error = err as { message?: string };
//       showToast(error.message ?? "Failed to delete task");
//       console.error("Failed to delete task:", err);
//     }
//     goBack();
//   }, [goBack, showToast, tasks]);

//   // ─── List actions ────────────────────────────────────────────────────────────

//   const addList = useCallback(async (name: string, color: string) => {
//     setIsLoading(true);
//     try {
//       const newList = await listApi.createList({ name, color });
//       setLists(prev => [...prev, listDtoToUi(newList)]);
//       showToast(`List "${name}" created`);
//     } catch (err) {
//       const error = err as { message?: string };
//       showToast(error.message ?? "Failed to create list");
//       console.error("Failed to create list:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [showToast]);

//   const deleteList = useCallback(async (id: string) => {
//     const listToDelete = lists.find(l => l.id === id);
    
//     // Optimistic update
//     setLists(prev => prev.filter(l => l.id !== id));
//     setTasks(prev => prev.filter(t => t.listId !== id));

//     try {
//       await listApi.deleteList(id);
//       showToast("List deleted");
//     } catch (err) {
//       // Revert on failure
//       if (listToDelete) {
//         setLists(prev => [...prev, listToDelete]);
//       }
//       if (listToDelete) {
//         setTasks(prev => prev.filter(t => t.listId === listToDelete.id));
//       }
//       const error = err as { message?: string };
//       showToast(error.message ?? "Failed to delete list");
//       console.error("Failed to delete list:", err);
//     }
//   }, [showToast, lists]);

//   // ─── Filtered tasks ──────────────────────────────────────────────────────────

//   const filteredTasks = filterListId
//     ? tasks.filter(t => t.listId === filterListId)
//     : tasks;

//   return {
//     // State
//     screen,
//     tasks: filteredTasks,
//     allTasks: tasks,
//     lists,
//     filterListId,
//     setFilterListId,
//     selectedTask,
//     setSelectedTask,
//     toast,
//     isLoading,
//     error,

//     // Navigation
//     navigate,
//     goBack,

//     // Actions
//     openTask,
//     openNewTask,
//     saveTask,
//     deleteTask,
//     toggleComplete,
//     addList,
//     deleteList,
//     showToast,

//     // Data fetching
//     fetchTasks,
//     fetchLists,
//     refreshAll,
//   };
// }

// export type AppApiClientState = ReturnType<typeof useAppApiClient>;





// hooks/useAppApiClient.ts
"use client";
import { useState, useCallback, useEffect } from "react";
import { taskApi, listApi, setTokenGetter } from "@/services/apiService";
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

  const [screen, setScreen]               = useState<"home" | "detail" | "lists">("home");
  const [screenHistory, setScreenHistory] = useState<("home" | "detail" | "lists")[]>([]);
  const [tasks,    setTasks]              = useState<Task[]>([]);
  const [lists,    setLists]              = useState<TaskList[]>([]);
  const [selectedTask, setSelectedTask]   = useState<Task | null>(null);
  const [filterListId, setFilterListId]   = useState<string | null>(null);
  const [toast,    setToast]              = useState<string | null>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [error,    setError]              = useState<string | null>(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async (params?: { listId?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskApi.getTasks({
        listId:           params?.listId ?? filterListId ?? undefined,
        grouped:          true,
        includeCompleted: false,   // FR-04 — hide completed
      });

      // Always flatten to Task[] for local state
      // Status is preserved from API — deriveStatus already ran server-side
      const dtos: TaskDTO[] = isGroupedTasks(data)
        ? flattenGrouped(data)
        : data;

      setTasks(dtos.map(taskDtoToUi));
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? "Failed to fetch tasks");
      console.error("[fetchTasks]", err);
    } finally {
      setIsLoading(false);
    }
  }, [filterListId]);

  // ── Fetch lists ────────────────────────────────────────────────────────────
  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listApi.getLists();
      setLists(data.map(listDtoToUi));
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? "Failed to fetch lists");
      console.error("[fetchLists]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // ── Delete task ────────────────────────────────────────────────────────────
  const deleteTask = useCallback(async (id: string) => {
    const backup = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const result = await taskApi.deleteTask(id);
      showToast(result.message ?? "Task deleted");
      await fetchLists(); // refresh overdue counts
    } catch (err) {
      if (backup) setTasks(prev => [...prev, backup]);
      const e = err as { message?: string };
      showToast(e.message ?? "Failed to delete task");
    }
    goBack();
  }, [tasks, goBack, fetchLists, showToast]);

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
    toggleComplete,
    addList,
    deleteList,
    showToast,
    fetchTasks,
    fetchLists,
    refreshAll,
    updateList,  // ← new API-integrated list update
  };
}

export type AppApiClientState = ReturnType<typeof useAppApiClient>;