"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticatedApp } from "@/hooks/useAuthenticatedApp";
import { HomeScreen } from "@/components/task/HomeScreen";
import { DetailScreen } from "@/components/task/DetailScreen";
import { ListsScreen } from "@/components/task/ListsScreen";
import { BottomNav } from "@/components/layout/BottomNav";
import { QuickAddBar } from "@/components/task/QuickAddBar";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import type { TaskDTO } from "@/types/task";

export default function Page() {
  const router = useRouter();
  const state = useAuthenticatedApp();

  const {
    screen,
    navigate,
    goBack,
    tasks,
    toast,
    isLoading,
    isAuthenticated,
    fetchTasks,
    fetchLists,
  } = state;

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const hasOverdue = tasks.some((t) => t.status === "overdue" && !t.completed);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      fetchLists();
    }
  }, [isAuthenticated, fetchTasks, fetchLists]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // ── + button handler ───────────────────────────────────────────────────────
  const handleAddNav = useCallback(() => {
    if (screen !== "home") navigate("home");
    setQuickAddOpen((v) => !v);
  }, [screen, navigate]);

  // ── QuickAddBar callbacks ──────────────────────────────────────────────────
  const handleTaskCreated = useCallback(
    (task: TaskDTO) => {
      showToast(`"${task.title}" added ✓`);
      setQuickAddOpen(false);
      fetchTasks(); // refresh list
    },
    [showToast, fetchTasks],
  );

  const handleQuickAddError = useCallback(
    (msg: string) => {
      showToast(msg);
    },
    [showToast],
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center min-h-screen bg-layer-0">
        <div className="flex items-center justify-center">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--color-primary)" }}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex justify-center min-h-screen bg-[#030d18]">
      <div className="relative w-full max-w-[430px] min-h-screen bg-layer-0 overflow-hidden flex flex-col">
        {/* ── Screen container ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative">
          {/* HOME */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              screen === "home"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 -translate-x-8 pointer-events-none",
            )}
          >
            <HomeScreen state={state} />
          </div>

          {/* DETAIL */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              screen === "detail"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 translate-x-8 pointer-events-none",
            )}
          >
            <DetailScreen state={state} />
          </div>

          {/* LISTS */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              screen === "lists"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 translate-x-8 pointer-events-none",
            )}
          >
            <ListsScreen state={state} />
          </div>
        </div>

        {/* ── QuickAddBar ────────────────────────────────────────────────── */}
        {/* Always mounted — controlled by open prop to preserve hook state  */}
        {screen !== "detail" && (
          <QuickAddBar
            open={quickAddOpen}
            onTaskCreated={handleTaskCreated}
            onError={handleQuickAddError}
            onClose={() => setQuickAddOpen(false)}
          />
        )}

        {/* ── Bottom nav ─────────────────────────────────────────────────── */}
        {screen !== "detail" && (
          <BottomNav
            screen={screen}
            hasOverdue={hasOverdue}
            quickAddOpen={quickAddOpen}
            onHome={() => {
              navigate("home");
              setQuickAddOpen(false);
            }}
            onAdd={handleAddNav}
            onLists={() => {
              navigate("lists");
              setQuickAddOpen(false);
            }}
          />
        )}

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        <Toast message={toastMsg ?? toast} />
      </div>
    </div>
  );
}