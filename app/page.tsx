// // app/page.tsx
// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { useAuthenticatedApp } from "@/hooks/useAuthenticatedApp";
// import { useCdfSettings } from "@/hooks/useCdfSettings";
// import { useFocusPopup } from "@/hooks/useFocusPopup";
// import { HomeScreen } from "@/components/task/HomeScreen";
// import { DetailScreen } from "@/components/task/DetailScreen";
// import { ListsScreen } from "@/components/task/ListsScreen";
// import { BottomNav } from "@/components/layout/BottomNav";
// import { QuickAddBar } from "@/components/task/QuickAddBar";
// import { FocusPopup } from "../components/task/FocusPopup";
// import { Toast } from "@/components/ui/Toast";
// import { cn } from "@/lib/cn";
// import type { TaskDTO } from "@/types/task";
// import type { CdfEventDTO } from "@/types/cdf";

// export default function Page() {
//   const router = useRouter();
//   const state = useAuthenticatedApp();

//   const {
//     screen,
//     navigate,
//     tasks,
//     toast,
//     isLoading,
//     isAuthenticated,
//     fetchTasks,
//     fetchLists,
//   } = state;

//   const [quickAddOpen, setQuickAddOpen] = useState(false);
//   const [toastMsg, setToastMsg] = useState<string | null>(null);

//   // ── CDF settings ──────────────────────────────────────────────────────────
//   const { enabled: cdfEnabled } = useCdfSettings();

//   // ── Focus popup ────────────────────────────────────────────────────────────
//   const {
//     popup,
//     isSubmitting: isFocusSubmitting,
//     openPopup,
//     setScore,
//     submitScore,
//   } = useFocusPopup(
//     useCallback((_event: CdfEventDTO) => {
//       // After focus submitted — show toast
//       showLocalToast("Focus score saved ✓");
//     }, []),
//   );

//   const hasOverdue = tasks.some((t) => t.status === "overdue" && !t.completed);

//   // ── Auth guard ─────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!isLoading && !isAuthenticated) router.push("/login");
//   }, [isAuthenticated, isLoading, router]);

//   // ── Fetch on mount ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (isAuthenticated) {
//       fetchTasks();
//       fetchLists();
//     }
//   }, [isAuthenticated, fetchTasks, fetchLists]);

//   // ── Toast ──────────────────────────────────────────────────────────────────
//   const showLocalToast = useCallback((msg: string) => {
//     setToastMsg(msg);
//     setTimeout(() => setToastMsg(null), 3000);
//   }, []);

//   // ── Navigation ─────────────────────────────────────────────────────────────
//   const handleHome = useCallback(() => {
//     navigate("home");
//     setQuickAddOpen(false);
//   }, [navigate]);

//   const handleLists = useCallback(() => {
//     navigate("lists");
//     setQuickAddOpen(false);
//   }, [navigate]);

//   const handleSettings = useCallback(() => {
//     router.push("/settings");
//   }, [router]);

//   const handleAdd = useCallback(() => {
//     if (screen !== "home") navigate("home");
//     setQuickAddOpen((v) => !v);
//   }, [screen, navigate]);

//   // ── CDF event handler — opens focus popup ─────────────────────────────────
//   const handleCdfEvent = useCallback(
//     (event: CdfEventDTO, taskTitle: string) => {
//       openPopup(event.id, taskTitle);
//     },
//     [openPopup],
//   );

//   // ── QuickAdd callbacks ─────────────────────────────────────────────────────
//   const handleTaskCreated = useCallback(
//     (task: TaskDTO) => {
//       showLocalToast(`"${task.title}" added ✓`);
//       setQuickAddOpen(false);
//       fetchTasks();
//     },
//     [showLocalToast, fetchTasks],
//   );

//   // ── Expose CDF context to HomeScreen via state ─────────────────────────────
//   const stateWithCdf = {
//     ...state,
//     cdfEnabled,
//     onCdfEvent: handleCdfEvent,
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <div className="flex justify-center min-h-screen bg-layer-0">
//         <div className="flex items-center justify-center">
//           <div
//             className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
//             style={{ borderColor: "var(--color-primary)" }}
//           />
//         </div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) return null;

//   return (
//     <div className="flex justify-center min-h-screen bg-[#030d18]">
//       <div
//         className="relative w-full max-w-[430px] flex flex-col"
//         style={{
//           minHeight: "100dvh",
//           backgroundColor: "var(--color-bg-app)",
//           overflow: "hidden",
//         }}
//       >
//         {/* ── Screens ────────────────────────────────────────────────── */}
//         <div className="flex-1 overflow-hidden relative">
//           {/* HOME */}
//           <div
//             className={cn(
//               "absolute inset-0 transition-all duration-300 ease-in-out",
//               screen === "home"
//                 ? "opacity-100 translate-x-0 pointer-events-auto"
//                 : "opacity-0 -translate-x-8 pointer-events-none",
//             )}
//           >
//             <HomeScreen state={stateWithCdf} />
//           </div>

//           {/* DETAIL */}
//           <div
//             className={cn(
//               "absolute inset-0 transition-all duration-300 ease-in-out",
//               screen === "detail"
//                 ? "opacity-100 translate-x-0 pointer-events-auto"
//                 : "opacity-0 translate-x-8 pointer-events-none",
//             )}
//           >
//             <DetailScreen state={state} />
//           </div>

//           {/* LISTS */}
//           <div
//             className={cn(
//               "absolute inset-0 transition-all duration-300 ease-in-out",
//               screen === "lists"
//                 ? "opacity-100 translate-x-0 pointer-events-auto"
//                 : "opacity-0 translate-x-8 pointer-events-none",
//             )}
//           >
//             <ListsScreen state={state} />
//           </div>
//         </div>

//         {/* ── QuickAddBar ──────────────────────────────────────────────── */}
//         {screen !== "detail" && (
//           <QuickAddBar
//             open={quickAddOpen}
//             onTaskCreated={handleTaskCreated}
//             onError={showLocalToast}
//             onClose={() => setQuickAddOpen(false)}
//           />
//         )}

//         {/* ── Bottom nav ───────────────────────────────────────────────── */}
//         {screen !== "detail" && (
//           <BottomNav
//             screen={screen}
//             hasOverdue={hasOverdue}
//             quickAddOpen={quickAddOpen}
//             onHome={handleHome}
//             onAdd={handleAdd}
//             onLists={handleLists}
//             onSettings={handleSettings}
//           />
//         )}

//         {/* ── Focus popup — rendered at root level ────────────────────── */}
//         {/* Rendered outside screen container so it overlays everything   */}
//         <FocusPopup
//           popup={popup}
//           isSubmitting={isFocusSubmitting}
//           onSetScore={setScore}
//           onSubmit={submitScore}
//         />

//         {/* ── Toast ────────────────────────────────────────────────────── */}
//         <Toast message={toastMsg ?? toast} />
//       </div>
//     </div>
//   );
// }

// app/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticatedApp } from "@/hooks/useAuthenticatedApp";
import { useCdfSettings } from "@/hooks/useCdfSettings";
import { useFocusPopup } from "@/hooks/useFocusPopup";
import { useCdfScores } from "@/hooks/useCdfScores";
import { HomeScreen } from "@/components/task/HomeScreen";
import { DetailScreen } from "@/components/task/DetailScreen";
import { ListsScreen } from "@/components/task/ListsScreen";
import { BottomNav } from "@/components/layout/BottomNav";
import { QuickAddBar } from "@/components/task/QuickAddBar";
import { FocusPopup } from "@/components/cdf/FocusPopup"; // ← fixed path
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import type { TaskDTO } from "@/types/task";
import type { CdfEventDTO } from "@/types/cdf";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

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

  // ── Toast — defined FIRST so callbacks below can reference it ─────────────
  const showLocalToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Inside Page component — after showLocalToast definition:
  const { isOnline, isSyncing, pendingCount } = useOfflineSync(
    useCallback(() => {
      // Refresh tasks after sync completes
      fetchTasks();
      fetchLists();
    }, [fetchTasks, fetchLists]),
  );

  // Use ref so useFocusPopup callback always has latest version
  const showLocalToastRef = useRef(showLocalToast);
  showLocalToastRef.current = showLocalToast;

  // ── CDF settings ──────────────────────────────────────────────────────────
  const { enabled: cdfEnabled } = useCdfSettings();

  // ── CDF scores — refresh after focus submission ───────────────────────────
  const { refresh: refreshCdfScores } = useCdfScores();

  // ── Focus popup ────────────────────────────────────────────────────────────
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

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleHome = useCallback(() => {
    navigate("home");
    setQuickAddOpen(false);
  }, [navigate]);

  const handleLists = useCallback(() => {
    navigate("lists");
    setQuickAddOpen(false);
  }, [navigate]);

  const handleSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleAdd = useCallback(() => {
    if (screen !== "home") navigate("home");
    setQuickAddOpen((v) => !v);
  }, [screen, navigate]);

  // ── CDF event handler — opens focus popup ─────────────────────────────────
  const handleCdfEvent = useCallback(
    (event: CdfEventDTO, taskTitle: string) => {
      openPopup(event.id, taskTitle);
    },
    [openPopup],
  );

  // ── QuickAdd callbacks ─────────────────────────────────────────────────────
  const handleTaskCreated = useCallback(
    (task: TaskDTO) => {
      showLocalToast(`"${task.title}" added ✓`);
      setQuickAddOpen(false);
      fetchTasks();
    },
    [showLocalToast, fetchTasks],
  );

  // ── CDF state passed to HomeScreen ────────────────────────────────────────
  const stateWithCdf = {
    ...state,
    cdfEnabled,
    onCdfEvent: handleCdfEvent,
  };

  // ── Loading ────────────────────────────────────────────────────────────────
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
      <OfflineBanner
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
      />
      <div
        className="relative w-full max-w-[430px] flex flex-col"
        style={{
          minHeight: "100dvh",
          backgroundColor: "var(--color-bg-app)",
          overflow: "hidden",
        }}
      >
        {/* ── Screens ────────────────────────────────────────────────── */}
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
            <HomeScreen state={stateWithCdf} />
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

        {/* ── QuickAddBar ──────────────────────────────────────────────── */}
        {screen !== "detail" && (
          <QuickAddBar
            open={quickAddOpen}
            onTaskCreated={handleTaskCreated}
            onError={showLocalToast}
            onClose={() => setQuickAddOpen(false)}
          />
        )}

        {/* ── Bottom nav ───────────────────────────────────────────────── */}
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
    </div>
  );
}
