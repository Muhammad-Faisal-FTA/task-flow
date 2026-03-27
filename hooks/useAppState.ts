"use client";
import { useState, useCallback } from "react";
import type { Task, TaskList, Screen } from "@/types";
import { INITIAL_TASKS, INITIAL_LISTS } from "@/lib/data";
import { generateId } from "@/lib/dateUtils";

export function useAppState() {
  const [screen, setScreen] = useState<Screen>("home");
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [lists, setLists] = useState<TaskList[]>(INITIAL_LISTS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterListId, setFilterListId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Navigation
  const navigate = useCallback((to: Screen) => {
    setScreenHistory(prev => [...prev, screen]);
    setScreen(to);
  }, [screen]);

  const goBack = useCallback(() => {
    setScreenHistory(prev => {
      const copy = [...prev];
      const last = copy.pop() ?? "home";
      setScreen(last);
      return copy;
    });
  }, []);

  // Toast
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  // Task actions
  const toggleComplete = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }, []);

  const openTask = useCallback((task: Task) => {
    setSelectedTask({ ...task });
    navigate("detail");
  }, [navigate]);

  const openNewTask = useCallback(() => {
    const blank: Task = {
      id: "",
      title: "",
      listId: lists[0]?.id ?? "default",
      completed: false,
      dueDate: new Date().toISOString().split("T")[0],
      dueTime: null,
      repeat: "none",
      status: "today",
    };
    setSelectedTask(blank);
    navigate("detail");
  }, [lists, navigate]);

  const saveTask = useCallback((task: Task) => {
    if (!task.title.trim()) return false;
    setTasks(prev => {
      const existing = prev.find(t => t.id === task.id);
      if (existing) return prev.map(t => t.id === task.id ? task : t);
      return [...prev, { ...task, id: generateId() }];
    });
    showToast(task.id ? "Task updated ✓" : "Task added ✓");
    goBack();
    return true;
  }, [goBack, showToast]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast("Task deleted");
    goBack();
  }, [goBack, showToast]);

  // List actions
  const addList = useCallback((name: string, color: string) => {
    const newList: TaskList = { id: generateId(), name, color, taskCount: 0, overdueCount: 0 };
    setLists(prev => [...prev, newList]);
    showToast(`List "${name}" created`);
  }, [showToast]);

  const deleteList = useCallback((id: string) => {
    setLists(prev => prev.filter(l => l.id !== id));
    setTasks(prev => prev.filter(t => t.listId !== id));
    showToast("List deleted");
  }, [showToast]);

  // Filtered tasks
  const filteredTasks = filterListId
    ? tasks.filter(t => t.listId === filterListId)
    : tasks;

  return {
    screen, navigate, goBack,
    tasks: filteredTasks, allTasks: tasks,
    lists, filterListId, setFilterListId,
    selectedTask, setSelectedTask,
    openTask, openNewTask, saveTask, deleteTask,
    toggleComplete,
    addList, deleteList,
    toast,
  };
}

export type AppState = ReturnType<typeof useAppState>;
