"use client";
import { Home, List, Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Screen } from "@/types";

interface BottomNavProps {
  screen: Screen;
  hasOverdue: boolean;
  quickAddOpen: boolean;
  onHome: () => void;
  onAdd: () => void;
  onLists: () => void;
}

export function BottomNav({
  screen,
  hasOverdue,
  quickAddOpen,
  onHome,
  onAdd,
  onLists,
}: BottomNavProps) {
  return (
    <nav
      className="relative z-[60] max-w-[430px] w-full mx-auto"
      style={{
        backgroundColor: "var(--color-bg-header)",
        borderTop: quickAddOpen
          ? "none"
          : "1px solid var(--color-border-default)",
      }}
    >
      <div className="flex items-center justify-around px-6 pt-2 pb-4">
        {/* Home */}
        <button
          onClick={onHome}
          className="flex flex-col items-center gap-1 px-4 py-1 min-w-[60px]"
        >
          <div className="relative">
            <Home
              className={cn(
                "w-5 h-5 transition-colors",
                screen === "home" && !quickAddOpen
                  ? "text-brand-highlight"
                  : "text-text-hint",
              )}
            />
            {hasOverdue && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
                style={{
                  backgroundColor: "var(--color-overdue)",
                  borderColor: "var(--color-bg-header)",
                }}
              />
            )}
          </div>
          <span
            className={cn(
              "text-[10px] font-medium transition-colors",
              screen === "home" && !quickAddOpen
                ? "text-brand-highlight"
                : "text-text-hint",
            )}
          >
            Home
          </span>
        </button>

        {/* FAB — center */}
        <button
          onClick={onAdd}
          aria-label={quickAddOpen ? "Close quick add" : "Add task"}
          className="flex flex-col items-center gap-1 min-w-[60px]"
        >
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-300 active:scale-90"
            style={{
              backgroundColor: quickAddOpen
                ? "var(--color-overdue)"
                : "var(--color-primary)",
              boxShadow: "var(--shadow-fab)",
            }}
          >
            {/* Switch icon instead of rotating */}
            {quickAddOpen ? (
              <X className="w-6 h-6 text-white" strokeWidth={2.5} />
            ) : (
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            )}
          </div>
          <span
            className="text-[10px] font-medium transition-colors"
            style={{
              color: quickAddOpen
                ? "var(--color-overdue)"
                : "var(--color-text-hint)",
            }}
          >
            {quickAddOpen ? "Close" : "Add"}
          </span>
        </button>

        {/* Lists */}
        <button
          onClick={onLists}
          className="flex flex-col items-center gap-1 px-4 py-1 min-w-[60px]"
        >
          <List
            className={cn(
              "w-5 h-5 transition-colors",
              screen === "lists" ? "text-brand-highlight" : "text-text-hint",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-medium transition-colors",
              screen === "lists" ? "text-brand-highlight" : "text-text-hint",
            )}
          >
            Lists
          </span>
        </button>
      </div>
    </nav>
  );
}
