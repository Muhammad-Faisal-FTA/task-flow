// app/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticatedApp } from "@/hooks/useAuthenticatedApp";
import { useCdfSettings } from "@/hooks/useCdfSettings";
import { useFocusPopup } from "@/hooks/useFocusPopup";
import { useCdfScores } from "@/hooks/useCdfScores";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { HomeScreen } from "@/components/task/HomeScreen";
import { DetailScreen } from "@/components/task/DetailScreen";
import { ListsScreen } from "@/components/task/ListsScreen";
import { BottomNav } from "@/components/layout/BottomNav";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { QuickAddBar } from "@/components/task/QuickAddBar";
import { FocusPopup } from "@/components/cdf/FocusPopup";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import type { TaskDTO } from "@/types/task";
import type { CdfEventDTO } from "@/types/cdf";

export default function Page() {
  const router = useRouter();
  const state = useAuthenticatedApp();

  const {
    screen,
    navigate,
    tasks,
    toast,
    isLoading,
    isAuthenticated,
    fetchTasks,
    fetchLists,
  } = state;

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showLocalToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const showLocalToastRef = useRef(showLocalToast);
  showLocalToastRef.current = showLocalToast;

  const { isOnline, isSyncing, pendingCount } = useOfflineSync(
    useCallback(() => {
      fetchTasks();
      fetchLists();
    }, [fetchTasks, fetchLists]),
  );

  const { enabled: cdfEnabled } = useCdfSettings();
  const { refresh: refreshCdfScores } = useCdfScores();

  const {
    popup,
    isSubmitting: isFocusSubmitting,
    openPopup,
    setScore,
    submitScore,
  } = useFocusPopup(
    useCallback(
      (_event: CdfEventDTO) => {
        showLocalToastRef.current("Focus score saved ✓");
        refreshCdfScores();
      },
      [refreshCdfScores],
    ),
  );

  const hasOverdue = tasks.some((t) => t.status === "overdue" && !t.completed);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      fetchLists();
    }
  }, [isAuthenticated, fetchTasks, fetchLists]);

  const handleHome = useCallback(() => {
    navigate("home");
    setQuickAddOpen(false);
  }, [navigate]);

  const handleLists = useCallback(() => {
    navigate("lists");
    setQuickAddOpen(false);
  }, [navigate]);

  const handleSettings = useCallback(() => router.push("/settings"), [router]);

  const handleAdd = useCallback(() => {
    if (screen !== "home") navigate("home");
    setQuickAddOpen((v) => !v);
  }, [screen, navigate]);

  const handleCdfEvent = useCallback(
    (event: CdfEventDTO, taskTitle: string) => {
      openPopup(event.id, taskTitle);
    },
    [openPopup],
  );

  const handleTaskCreated = useCallback(
    (task: TaskDTO) => {
      showLocalToast(`"${task.title}" added ✓`);
      setQuickAddOpen(false);
      fetchTasks();
    },
    [showLocalToast, fetchTasks],
  );

  const stateWithCdf = { ...state, cdfEnabled, onCdfEvent: handleCdfEvent };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--color-bg-app)" }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-primary)" }}
        />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg-app)",
        display: "flex",
      }}
    >
      <OfflineBanner
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
      />

      {/* ── DESKTOP: Sidebar ──────────────────────────────────────────── */}
      <div className="hidden md:block flex-shrink-0">
        <SidebarNav
          screen={screen}
          hasOverdue={hasOverdue}
          quickAddOpen={quickAddOpen}
          onHome={handleHome}
          onAdd={handleAdd}
          onLists={handleLists}
          onSettings={handleSettings}
        />
      </div>

      {/* ── Center: Task list panel ───────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--color-border-default)",
          position: "relative",
          overflow: "hidden", // ← prevents task cards overflowing
          minHeight: "100dvh",
        }}
      >
        {/* ── Screen transitions ──────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative">
          {/* HOME */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              screen === "home"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 -translate-x-4 pointer-events-none",
            )}
          >
            <HomeScreen state={stateWithCdf} />
          </div>

          {/* LISTS */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              screen === "lists"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 translate-x-4 pointer-events-none",
            )}
          >
            <ListsScreen state={state} />
          </div>

          {/* DETAIL — mobile only (full screen) */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out md:hidden",
              screen === "detail"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 translate-x-4 pointer-events-none",
            )}
          >
            <DetailScreen state={state} />
          </div>
        </div>

        {/* ── MOBILE: Bottom nav ───────────────────────────────────────── */}
        <div className="md:hidden">
          {screen !== "detail" && (
            <BottomNav
              screen={screen}
              hasOverdue={hasOverdue}
              quickAddOpen={quickAddOpen}
              onHome={handleHome}
              onAdd={handleAdd}
              onLists={handleLists}
              onSettings={handleSettings}
            />
          )}
        </div>
      </div>

      {/* ── DESKTOP: Detail panel (fills remaining width) ────────────── */}
      <div
        className="hidden md:flex flex-col flex-1"
        style={{
          minHeight: "100dvh",
          backgroundColor: "var(--color-bg-app)",
          overflow: "hidden",
        }}
      >
        {screen === "detail" ? (
          <DetailScreen state={state} />
        ) : (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center h-full"
            style={{ color: "var(--color-text-hint)" }}
          >
            <div
              className="flex items-center justify-center rounded-full mb-4"
              style={{
                width: "72px",
                height: "72px",
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <span style={{ fontSize: "32px" }}>✓</span>
            </div>
            <p
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: "8px",
              }}
            >
              Select a task
            </p>
            <p style={{ fontSize: "var(--text-base)" }}>
              Click any task to view or edit details
            </p>
          </div>
        )}
      </div>

      {/* ── QuickAddBar — modal on desktop, bottom sheet on mobile ──── */}
      <QuickAddBar
        open={quickAddOpen}
        onTaskCreated={handleTaskCreated}
        onError={showLocalToast}
        onClose={() => setQuickAddOpen(false)}
      />

      {/* ── Focus popup ──────────────────────────────────────────────── */}
      <FocusPopup
        popup={popup}
        isSubmitting={isFocusSubmitting}
        onSetScore={setScore}
        onSubmit={submitScore}
      />

      {/* ── Toast ────────────────────────────────────────────────────── */}
      <Toast message={toastMsg ?? toast} />
    </div>
  );
}
