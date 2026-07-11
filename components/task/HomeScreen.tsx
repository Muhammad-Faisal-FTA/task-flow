// components/task/HomeScreen.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { FilterBar } from "@/components/layout/FilterBar";
import { TaskCard } from "@/components/task/TaskCard";
import { SearchBar } from "@/components/task/SearchBar";
import { SearchResults } from "@/components/task/SearchResults";
import { useTaskToggle } from "@/hooks/useTaskToggle";
import { useSearch } from "@/hooks/useSearch";
import type { TaskDTO, TaskListDTO } from "@/types/task";
import type { CdfEventDTO } from "@/types/cdf";
import type { Screen } from "@/types";
import { NotificationBanner } from "@/hooks/NotificationBanner";
import { CacheIndicator } from "@/components/ui/CacheIndicator";


// ─── Types ────────────────────────────────────────────────────────────────────
interface HomeScreenState {
  tasks: TaskDTO[];
  lists: TaskListDTO[];
  filterListId: string | null;
  setFilterListId: (id: string | null) => void;
  openTask: (task: TaskDTO) => void;
  navigate: (screen: Screen) => void;
  fetchTasks?: () => void;
  showToast?: (msg: string) => void;
  cdfEnabled?: boolean;
  onCdfEvent?: (event: CdfEventDTO, taskTitle: string) => void;
  isFromCache?:  boolean;
  isLoadingData?: boolean;
}

// ─── Section config ───────────────────────────────────────────────────────────
const SECTIONS: { label: string; status: TaskDTO["status"] }[] = [
  { label: "OVERDUE", status: "overdue" },
  { label: "TODAY", status: "today" },
  { label: "TOMORROW", status: "tomorrow" },
  { label: "NEXT WEEK", status: "next_week" },
  { label: "UPCOMING", status: "future" },
  { label: "NO DATE", status: "nodate" },
];

const SECTION_DOT: Record<string, string> = {
  overdue: "var(--color-overdue)",
  today: "var(--color-today)",
  tomorrow: "var(--color-accent)",
  next_week: "var(--color-primary)",
  future: "var(--color-text-secondary)",
  nodate: "var(--color-text-hint)",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function HomeScreen({ state }: { state: HomeScreenState }) {
  const {
    tasks,
    lists,
    filterListId,
    setFilterListId,
    openTask,
    navigate,
    fetchTasks,
    showToast,
    cdfEnabled,
    onCdfEvent,
  } = state;

  // ── Search state ───────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);

  const {
    query,
    setQuery,
    results,
    isSearching,
    hasSearched,
    clear: clearSearch,
  } = useSearch(350);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalOverdue = useMemo(
    () => tasks.filter((t) => t.status === "overdue" && !t.completed).length,
    [tasks],
  );
  const totalToday = useMemo(
    () => tasks.filter((t) => t.status === "today" && !t.completed).length,
    [tasks],
  );

  // ── Stable callbacks for useTaskToggle ────────────────────────────────────
  const handleSuccess = useCallback(() => {
    fetchTasks?.();
  }, [fetchTasks]);

  const handleError = useCallback(
    (msg: string) => {
      showToast?.(msg);
    },
    [showToast],
  );

  const handleCdfEvent = useCallback(
    (event: CdfEventDTO, title: string) => {
      onCdfEvent?.(event, title);
    },
    [onCdfEvent],
  );

  // ── Toggle hook — INSIDE component ────────────────────────────────────────
  const { toggle, isToggling } = useTaskToggle({
    onSuccess: handleSuccess,
    onError: handleError,
    isCdfEnabled: cdfEnabled ?? false,
    onCdfEvent: handleCdfEvent,
  });

  // ── Search handlers ────────────────────────────────────────────────────────
  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    clearSearch();
  }, [clearSearch]);

  const handleSearchTaskClick = useCallback(
    (task: TaskDTO) => {
      openTask(task);
      handleCloseSearch();
    },
    [openTask, handleCloseSearch],
  );

  const isEmpty = tasks.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <HeaderBar
        title="✓ All Tasks"
        rightAction={
          <div className="flex items-center gap-2">
            <button
              onClick={searchOpen ? handleCloseSearch : handleOpenSearch}
              className="w-9 h-9 flex items-center justify-center rounded-[8px] active:scale-90 transition-all duration-200"
              style={{
                backgroundColor: searchOpen
                  ? "var(--color-primary)"
                  : "var(--color-bg-card)",
              }}
              aria-label={searchOpen ? "Close search" : "Search tasks"}
            >
              <NotificationBanner />


              <Search
                className="w-4 h-4"
                style={{
                  color: searchOpen ? "#ffffff" : "var(--color-text-hint)",
                }}
              />
            </button>

            <button
              onClick={() => navigate("lists")}
              className="w-9 h-9 flex items-center justify-center rounded-[8px] active:scale-90 transition-transform"
              style={{ backgroundColor: "var(--color-bg-card)" }}
            >
              <LayoutGrid
                className="w-4 h-4"
                style={{ color: "var(--color-text-hint)" }}
              />
            </button>
          </div>
        }
      />
       <CacheIndicator
        isFromCache={state.isFromCache ?? false}
        isLoading={state.isLoadingData ?? false}
        />
      {/* ── Search bar ────────────────────────────────────────────────── */}
      <SearchBar
        open={searchOpen}
        query={query}
        isSearching={isSearching}
        onChange={setQuery}
        onClear={clearSearch}
        onClose={handleCloseSearch}
      />

      {/* ── Filter pills ──────────────────────────────────────────────── */}
      {!searchOpen && (
        <FilterBar
          lists={lists}
          activeId={filterListId}
          onChange={setFilterListId}
        />
      )}

      {/* ── Stats strip ───────────────────────────────────────────────── */}
      {!filterListId && !searchOpen && (
        <div
          className="flex gap-2 px-4 py-2"
          style={{ backgroundColor: "var(--color-bg-app)" }}
        >
          {[
            {
              count: totalOverdue,
              label: "Overdue",
              color: "var(--color-overdue)",
            },
            {
              count: totalToday,
              label: "Due Today",
              color: "var(--color-today)",
            },
            {
              count: tasks.length,
              label: "Total",
              color: "var(--color-accent)",
            },
          ].map(({ count, label, color }) => (
            <div
              key={label}
              className="flex-1 rounded-card px-3 py-2"
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderLeft: `3px solid ${color}`,
              }}
            >
              <p
                className="font-bold leading-none"
                style={{ fontSize: "22px", color }}
              >
                {count}
              </p>
              <p
                className="mt-0.5"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-hint)",
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ padding: "16px 16px 100px" }}
      >
        {searchOpen ? (
          <SearchResults
            query={query}
            results={results}
            lists={lists}
            isSearching={isSearching}
            hasSearched={hasSearched}
            onTaskClick={handleSearchTaskClick}
          />
        ) : isEmpty ? (
          <div
            className="flex flex-col items-center justify-center py-20"
            style={{ color: "var(--color-text-hint)" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--color-bg-card)" }}
            >
              <span style={{ fontSize: "28px" }}>✓</span>
            </div>
            <p
              className="font-medium"
              style={{
                fontSize: "var(--text-md)",
                color: "var(--color-text-primary)",
              }}
            >
              All done!
            </p>
            <p className="mt-1" style={{ fontSize: "var(--text-sm)" }}>
              No tasks here.
            </p>
          </div>
        ) : (
          SECTIONS.map(({ label, status }) => {
            const sectionTasks = tasks.filter(
              (t) => t.status === status && !t.completed,
            );

            if (sectionTasks.length === 0) return null;

            return (
              <div key={status} className="mb-5">
                {/* Section header */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SECTION_DOT[status] }}
                  />
                  <span
                    className="font-semibold tracking-widest uppercase"
                    style={{
                      fontSize: "var(--text-xs)",
                      color: SECTION_DOT[status],
                    }}
                  >
                    {label}
                  </span>
                  <span
                    className="ml-auto"
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-hint)",
                    }}
                  >
                    {sectionTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="flex flex-col gap-2">
                  {sectionTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      list={lists.find((l) => l.id === task.listId)}
                      onToggle={toggle}
                      onClick={openTask}
                      isToggling={isToggling(task.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
