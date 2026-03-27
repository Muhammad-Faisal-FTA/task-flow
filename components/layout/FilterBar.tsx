"use client";
import { cn } from "@/lib/cn";
import type { TaskList } from "@/types";

interface FilterBarProps {
  lists: TaskList[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}

export function FilterBar({ lists, activeId, onChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none bg-layer-0">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "flex-shrink-0 px-4 py-1.5 rounded-pill text-[13px] font-medium border transition-all duration-200",
          activeId === null
            ? "bg-brand border-brand text-white"
            : "bg-transparent border-layer-3/50 text-text-tag"
        )}
      >
        All Lists
      </button>
      {lists.map(list => (
        <button
          key={list.id}
          onClick={() => onChange(list.id)}
          className={cn(
            "flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-pill text-[13px] font-medium border transition-all duration-200",
            activeId === list.id
              ? "border-transparent text-white"
              : "bg-transparent border-layer-3/50 text-text-tag"
          )}
          style={activeId === list.id ? { backgroundColor: list.color, borderColor: list.color } : {}}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: list.color }}
          />
          {list.name}
        </button>
      ))}
    </div>
  );
}
