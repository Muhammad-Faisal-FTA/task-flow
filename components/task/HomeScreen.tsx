"use client";
import { useMemo } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { FilterBar } from "@/components/layout/FilterBar";
import { TaskSection } from "@/components/task/TaskSection";
import { LayoutGrid } from "lucide-react";
import type { Task, TaskList, Screen } from "@/types";

// Flexible interface that works with both useAppState and useAuthenticatedApp
interface HomeScreenState {
  tasks: Task[];
  lists: TaskList[];
  filterListId: string | null;
  setFilterListId: (id: string | null) => void;
  toggleComplete: (id: string) => void;
  openTask: (task: Task) => void;
  navigate: (screen: Screen) => void;
}

const SECTIONS: { label: string; status: Task["status"] }[] = [
  { label: "OVERDUE", status: "overdue" },
  { label: "TODAY", status: "today" },
  { label: "TOMORROW", status: "tomorrow" },
  { label: "UPCOMING", status: "future" },
  { label: "NO DATE", status: "nodate" },
];

interface HomeScreenProps {
  state: HomeScreenState;
}

export function HomeScreen({ state }: HomeScreenProps) {
  const { tasks, lists, filterListId, setFilterListId, toggleComplete, openTask, navigate } = state;

  const totalOverdue = useMemo(() => tasks.filter(t => t.status === "overdue" && !t.completed).length, [tasks]);
  const totalToday = useMemo(() => tasks.filter(t => t.status === "today" && !t.completed).length, [tasks]);

  return (
    <div className="flex flex-col h-full">
      <HeaderBar
        title="✓ All Tasks"
        rightAction={
          <button
            onClick={() => navigate("lists")}
            className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-layer-2 active:bg-layer-3 transition-colors"
          >
            <LayoutGrid className="w-4 h-4 text-text-tag" />
          </button>
        }
      />

      <FilterBar lists={lists} activeId={filterListId} onChange={setFilterListId} />

      {/* Stats strip */}
      {!filterListId && (
        <div className="flex gap-2 px-4 py-2 bg-layer-0">
          <div className="flex-1 bg-layer-2 rounded-card px-3 py-2 border-l-[3px] border-l-status-overdue">
            <p className="text-[22px] font-bold text-status-overdue leading-none">{totalOverdue}</p>
            <p className="text-[11px] text-text-tag mt-0.5">Overdue</p>
          </div>
          <div className="flex-1 bg-layer-2 rounded-card px-3 py-2 border-l-[3px] border-l-status-today">
            <p className="text-[22px] font-bold text-status-today leading-none">{totalToday}</p>
            <p className="text-[11px] text-text-tag mt-0.5">Due Today</p>
          </div>
          <div className="flex-1 bg-layer-2 rounded-card px-3 py-2 border-l-[3px] border-l-brand-highlight">
            <p className="text-[22px] font-bold text-brand-highlight leading-none">{tasks.length}</p>
            <p className="text-[11px] text-text-tag mt-0.5">Total</p>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-none">
        {SECTIONS.map(({ label, status }) => {
          const sectionTasks = tasks.filter(t => t.status === status);
          return (
            <TaskSection
              key={status}
              label={label}
              status={status}
              tasks={sectionTasks}
              lists={lists}
              onToggle={toggleComplete}
              onClick={openTask}
            />
          );
        })}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-text-tag">
            <div className="w-16 h-16 rounded-full bg-layer-2 flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-[15px] font-medium text-text-primary">All done!</p>
            <p className="text-[13px] mt-1">No tasks here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
