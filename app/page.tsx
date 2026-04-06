"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticatedApp } from "@/hooks/useAuthenticatedApp";
import { HomeScreen } from "@/components/task/HomeScreen";
import { DetailScreen } from "@/components/task/DetailScreen";
import { ListsScreen } from "@/components/task/ListsScreen";
import { BottomNav } from "@/components/layout/BottomNav";
import { QuickAddBar } from "@/components/task/QuickAddBar";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

export default function Page() {
  const router = useRouter();
  const state = useAuthenticatedApp();
  const {
    screen,
    navigate,
    goBack,
    tasks,
    openNewTask,
    toast,
    isLoading,
    isAuthenticated,
    fetchTasks,
    fetchLists,
  } = state;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      fetchLists();
    }
  }, [isAuthenticated, fetchTasks, fetchLists]);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const hasOverdue = tasks.some((t) => t.status === "overdue" && !t.completed);

  const handleAddNav = () => {
    if (screen !== "home") {
      navigate("home");
    }
    setQuickAddOpen((v) => !v);
  };

  const handleQuickAdd = async (title: string) => {
    await state.saveTask({
      id: "",
      title,
      listId: state.lists[0]?.id ?? "default",
      completed: false,
      dueDate: new Date().toISOString().split("T")[0],
      dueTime: null,
      repeat: "none",
    });
    setQuickAddOpen(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center min-h-screen bg-[#030d18]">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Don't render app if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    /* Outer wrapper: centers the 430px phone shell on desktop */
    <div className="flex justify-center min-h-screen bg-[#030d18]">
      <div className="relative w-full max-w-[430px] min-h-screen bg-layer-0 overflow-hidden flex flex-col">
        {/* Screen container */}
        <div className="flex-1 overflow-hidden relative">
          {/* HOME */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              screen === "home"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : screen === "detail" || screen === "lists"
                  ? "opacity-0 -translate-x-8 pointer-events-none"
                  : "opacity-0 pointer-events-none",
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

        {/* Quick add bar */}
        {quickAddOpen && screen === "home" && (
          <QuickAddBar
            onAdd={handleQuickAdd}
            onClose={() => setQuickAddOpen(false)}
          />
        )}

        {/* Bottom nav (hidden on detail) */}
        {screen !== "detail" && (
          <BottomNav
            screen={screen}
            hasOverdue={hasOverdue}
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

        {/* Toast */}
        <Toast message={toast} />
      </div>
    </div>
  );
}