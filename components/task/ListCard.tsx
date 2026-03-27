"use client";
import { AlignJustify, Trash2 } from "lucide-react";
import type { TaskList } from "@/types";
import { cn } from "@/lib/cn";

interface ListCardProps {
  list: TaskList;
  onDelete: (id: string) => void;
}

export function ListCard({ list, onDelete }: ListCardProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-card bg-layer-2 shadow-card animate-slide-up border-l-[3px]"
    )}
    style={{ borderLeftColor: list.color }}
    >
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: list.color }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-text-primary truncate">{list.name}</p>
        <p className="text-[12px] text-text-tag mt-0.5">
          {list.taskCount > 0 ? (
            <>
              Tasks: {list.taskCount}
              {list.overdueCount > 0 && (
                <span className="text-status-overdue"> · {list.overdueCount} overdue</span>
              )}
            </>
          ) : (
            "No tasks"
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-layer-1 hover:bg-layer-3/30 transition-colors"
          aria-label="Reorder"
        >
          <AlignJustify className="w-4 h-4 text-text-tag" />
        </button>
        <button
          onClick={() => onDelete(list.id)}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-layer-1 hover:bg-status-overdue/20 transition-colors"
          aria-label="Delete list"
        >
          <Trash2 className="w-4 h-4 text-text-tag hover:text-status-overdue transition-colors" />
        </button>
      </div>
    </div>
  );
}
