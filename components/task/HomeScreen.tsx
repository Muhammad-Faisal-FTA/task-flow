// // components/task/HomeScreen.tsx
// "use client";

// import { useMemo, useCallback } from "react";
// import { LayoutGrid } from "lucide-react";
// import { HeaderBar }    from "@/components/layout/HeaderBar";
// import { FilterBar }    from "@/components/layout/FilterBar";
// import { TaskCard }     from "@/components/task/TaskCard";
// import { useTaskToggle } from "@/hooks/useTaskToggle";
// import type { TaskDTO, TaskListDTO } from "@/types/task";
// import type { Screen } from "@/types";

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface HomeScreenState {
//   tasks:           TaskDTO[];
//   lists:           TaskListDTO[];
//   filterListId:    string | null;
//   setFilterListId: (id: string | null) => void;
//   openTask:        (task: TaskDTO) => void;
//   navigate:        (screen: Screen) => void;
//   fetchTasks?:     () => void;
//   showToast?:      (msg: string) => void;
// }

// interface HomeScreenProps {
//   state: HomeScreenState;
// }

// // ─── Section config ───────────────────────────────────────────────────────────
// const SECTIONS: { label: string; status: TaskDTO["status"] }[] = [
//   { label: "OVERDUE",  status: "overdue"   },
//   { label: "TODAY",    status: "today"     },
//   { label: "TOMORROW", status: "tomorrow"  },
//   { label: "NEXT WEEK",status: "next_week" },
//   { label: "UPCOMING", status: "future"    },
//   { label: "NO DATE",  status: "nodate"    },
// ];

// const SECTION_DOT: Record<string, string> = {
//   overdue:   "var(--color-overdue)",
//   today:     "var(--color-today)",
//   tomorrow:  "var(--color-accent)",
//   next_week: "var(--color-primary)",
//   future:    "var(--color-text-secondary)",
//   nodate:    "var(--color-text-hint)",
// };

// // ─── Component ────────────────────────────────────────────────────────────────
// export function HomeScreen({ state }: HomeScreenProps) {
//   const {
//     tasks,
//     lists,
//     filterListId,
//     setFilterListId,
//     openTask,
//     navigate,
//     fetchTasks,
//     showToast,
//   } = state;

//   // ── Stats ──────────────────────────────────────────────────────────────────
//   const totalOverdue = useMemo(
//     () => tasks.filter(t => t.status === "overdue" && !t.completed).length,
//     [tasks]
//   );
//   const totalToday = useMemo(
//     () => tasks.filter(t => t.status === "today" && !t.completed).length,
//     [tasks]
//   );

//   // ── Toggle hook ────────────────────────────────────────────────────────────
//   const { toggle, isToggling } = useTaskToggle({
//     onSuccess: useCallback(() => {
//       fetchTasks?.();
//     }, [fetchTasks]),
//     onError: useCallback((msg: string) => {
//       showToast?.(msg);
//     }, [showToast]),
//   });

//   // ── Empty state ────────────────────────────────────────────────────────────
//   const isEmpty = tasks.length === 0;

//   return (
//     <div className="flex flex-col h-full">

//       {/* Header */}
//       <HeaderBar
//         title="✓ All Tasks"
//         rightAction={
//           <button
//             onClick={() => navigate("lists")}
//             className="w-9 h-9 flex items-center justify-center rounded-[8px] active:scale-90 transition-transform"
//             style={{ backgroundColor: "var(--color-bg-card)" }}
//           >
//             <LayoutGrid
//               className="w-4 h-4"
//               style={{ color: "var(--color-text-hint)" }}
//             />
//           </button>
//         }
//       />

//       {/* Filter pills */}
//       <FilterBar
//         lists={lists}
//         activeId={filterListId}
//         onChange={setFilterListId}
//       />

//       {/* Stats strip */}
//       {!filterListId && (
//         <div
//           className="flex gap-2 px-4 py-2"
//           style={{ backgroundColor: "var(--color-bg-app)" }}
//         >
//           {/* Overdue */}
//           <div
//             className="flex-1 rounded-card px-3 py-2"
//             style={{
//               backgroundColor: "var(--color-bg-card)",
//               borderLeft:      "3px solid var(--color-overdue)",
//             }}
//           >
//             <p
//               className="font-bold leading-none"
//               style={{
//                 fontSize: "22px",
//                 color:    "var(--color-overdue)",
//               }}
//             >
//               {totalOverdue}
//             </p>
//             <p
//               className="mt-0.5"
//               style={{
//                 fontSize: "var(--text-xs)",
//                 color:    "var(--color-text-hint)",
//               }}
//             >
//               Overdue
//             </p>
//           </div>

//           {/* Today */}
//           <div
//             className="flex-1 rounded-card px-3 py-2"
//             style={{
//               backgroundColor: "var(--color-bg-card)",
//               borderLeft:      "3px solid var(--color-today)",
//             }}
//           >
//             <p
//               className="font-bold leading-none"
//               style={{
//                 fontSize: "22px",
//                 color:    "var(--color-today)",
//               }}
//             >
//               {totalToday}
//             </p>
//             <p
//               className="mt-0.5"
//               style={{
//                 fontSize: "var(--text-xs)",
//                 color:    "var(--color-text-hint)",
//               }}
//             >
//               Due Today
//             </p>
//           </div>

//           {/* Total */}
//           <div
//             className="flex-1 rounded-card px-3 py-2"
//             style={{
//               backgroundColor: "var(--color-bg-card)",
//               borderLeft:      "3px solid var(--color-accent)",
//             }}
//           >
//             <p
//               className="font-bold leading-none"
//               style={{
//                 fontSize: "22px",
//                 color:    "var(--color-accent)",
//               }}
//             >
//               {tasks.length}
//             </p>
//             <p
//               className="mt-0.5"
//               style={{
//                 fontSize: "var(--text-xs)",
//                 color:    "var(--color-text-hint)",
//               }}
//             >
//               Total
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Task sections */}
//       <div
//         className="flex-1 overflow-y-auto scrollbar-hide"
//         style={{ padding: "16px 16px 100px" }}
//       >
//         {isEmpty ? (
//           // Empty state
//           <div
//             className="flex flex-col items-center justify-center py-20"
//             style={{ color: "var(--color-text-hint)" }}
//           >
//             <div
//               className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
//               style={{ backgroundColor: "var(--color-bg-card)" }}
//             >
//               <span style={{ fontSize: "28px" }}>✓</span>
//             </div>
//             <p
//               className="font-medium"
//               style={{
//                 fontSize: "var(--text-md)",
//                 color:    "var(--color-text-primary)",
//               }}
//             >
//               All done!
//             </p>
//             <p
//               className="mt-1"
//               style={{ fontSize: "var(--text-sm)" }}
//             >
//               No tasks here.
//             </p>
//           </div>
//         ) : (
//           SECTIONS.map(({ label, status }) => {
//             const sectionTasks = tasks.filter(
//               t => t.status === status && !t.completed
//             );

//             if (sectionTasks.length === 0) return null;

//             return (
//               <div key={status} className="mb-5">
//                 {/* Section header */}
//                 <div
//                   className="flex items-center gap-2 mb-2.5"
//                 >
//                   <span
//                     className="w-2 h-2 rounded-full flex-shrink-0"
//                     style={{ backgroundColor: SECTION_DOT[status] }}
//                   />
//                   <span
//                     className="font-semibold tracking-widest uppercase"
//                     style={{
//                       fontSize: "var(--text-xs)",
//                       color:    SECTION_DOT[status],
//                     }}
//                   >
//                     {label}
//                   </span>
//                   <span
//                     className="ml-auto"
//                     style={{
//                       fontSize: "var(--text-xs)",
//                       color:    "var(--color-text-hint)",
//                     }}
//                   >
//                     {sectionTasks.length}
//                   </span>
//                 </div>

//                 {/* Task cards */}
//                 <div className="flex flex-col gap-2">
//                   {sectionTasks.map(task => (
//                     <TaskCard
//                       key={task.id}
//                       task={task}
//                       list={lists.find(l => l.id === task.listId)}
//                       onToggle={toggle}
//                       onClick={openTask}
//                       isToggling={isToggling(task.id)}
//                     />
//                   ))}
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// }



// components/task/HomeScreen.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { HeaderBar }     from "@/components/layout/HeaderBar";
import { FilterBar }     from "@/components/layout/FilterBar";
import { TaskCard }      from "@/components/task/TaskCard";
import { SearchBar }     from "@/components/task/SearchBar";
import { SearchResults } from "@/components/task/SearchResults";
import { useTaskToggle } from "@/hooks/useTaskToggle";
import { useSearch }     from "@/hooks/useSearch";
import type { TaskDTO, TaskListDTO } from "@/types/task";
import type { Screen } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HomeScreenState {
  tasks:           TaskDTO[];
  lists:           TaskListDTO[];
  filterListId:    string | null;
  setFilterListId: (id: string | null) => void;
  openTask:        (task: TaskDTO) => void;
  navigate:        (screen: Screen) => void;
  fetchTasks?:     () => void;
  showToast?:      (msg: string) => void;
}

// ─── Section config ───────────────────────────────────────────────────────────
const SECTIONS: { label: string; status: TaskDTO["status"] }[] = [
  { label: "OVERDUE",   status: "overdue"   },
  { label: "TODAY",     status: "today"     },
  { label: "TOMORROW",  status: "tomorrow"  },
  { label: "NEXT WEEK", status: "next_week" },
  { label: "UPCOMING",  status: "future"    },
  { label: "NO DATE",   status: "nodate"    },
];

const SECTION_DOT: Record<string, string> = {
  overdue:   "var(--color-overdue)",
  today:     "var(--color-today)",
  tomorrow:  "var(--color-accent)",
  next_week: "var(--color-primary)",
  future:    "var(--color-text-secondary)",
  nodate:    "var(--color-text-hint)",
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
    () => tasks.filter(t => t.status === "overdue" && !t.completed).length,
    [tasks]
  );
  const totalToday = useMemo(
    () => tasks.filter(t => t.status === "today" && !t.completed).length,
    [tasks]
  );

  // ── Toggle hook ────────────────────────────────────────────────────────────
  const { toggle, isToggling } = useTaskToggle({
    onSuccess: useCallback(() => fetchTasks?.(), [fetchTasks]),
    onError:   useCallback((msg: string) => showToast?.(msg), [showToast]),
  });

  // ── Search handlers ────────────────────────────────────────────────────────
  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    clearSearch();
  }, [clearSearch]);

  // Convert TaskDTO → TaskDTO (already correct type, just pass through)
  const handleSearchTaskClick = useCallback((task: TaskDTO) => {
    openTask(task);
    handleCloseSearch();
  }, [openTask, handleCloseSearch]);

  const isEmpty = tasks.length === 0;

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <HeaderBar
        title="✓ All Tasks"
        rightAction={
          <div className="flex items-center gap-2">

            {/* Search button */}
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
              <Search
                className="w-4 h-4"
                style={{
                  color: searchOpen
                    ? "#ffffff"
                    : "var(--color-text-hint)",
                }}
              />
            </button>

            {/* Lists button */}
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

      {/* ── Search bar — slide down from header ───────────────────────── */}
      <SearchBar
        open={searchOpen}
        query={query}
        isSearching={isSearching}
        onChange={setQuery}
        onClear={clearSearch}
        onClose={handleCloseSearch}
      />

      {/* ── Filter pills — hidden during search ───────────────────────── */}
      {!searchOpen && (
        <FilterBar
          lists={lists}
          activeId={filterListId}
          onChange={setFilterListId}
        />
      )}

      {/* ── Stats strip — hidden during search + when list filtered ──── */}
      {!filterListId && !searchOpen && (
        <div
          className="flex gap-2 px-4 py-2"
          style={{ backgroundColor: "var(--color-bg-app)" }}
        >
          {[
            { count: totalOverdue, label: "Overdue",  color: "var(--color-overdue)" },
            { count: totalToday,   label: "Due Today", color: "var(--color-today)"  },
            { count: tasks.length, label: "Total",     color: "var(--color-accent)" },
          ].map(({ count, label, color }) => (
            <div
              key={label}
              className="flex-1 rounded-card px-3 py-2"
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderLeft:      `3px solid ${color}`,
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
                  color:    "var(--color-text-hint)",
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

        {/* Search mode */}
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
          /* Empty state */
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
                color:    "var(--color-text-primary)",
              }}
            >
              All done!
            </p>
            <p className="mt-1" style={{ fontSize: "var(--text-sm)" }}>
              No tasks here.
            </p>
          </div>

        ) : (
          /* Task sections */
          SECTIONS.map(({ label, status }) => {
            const sectionTasks = tasks.filter(
              t => t.status === status && !t.completed
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
                      color:    SECTION_DOT[status],
                    }}
                  >
                    {label}
                  </span>
                  <span
                    className="ml-auto"
                    style={{
                      fontSize: "var(--text-xs)",
                      color:    "var(--color-text-hint)",
                    }}
                  >
                    {sectionTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="flex flex-col gap-2">
                  {sectionTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      list={lists.find(l => l.id === task.listId)}
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