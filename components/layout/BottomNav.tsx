"use client";
import { Home, Plus, List } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Screen } from "@/types";

interface BottomNavProps {
  screen: Screen;
  hasOverdue: boolean;
  onHome: () => void;
  onAdd: () => void;
  onLists: () => void;
}

export function BottomNav({ screen, hasOverdue, onHome, onAdd, onLists }: BottomNavProps) {
  const items = [
    { icon: Home, label: "Home", screen: "home" as Screen, action: onHome },
    { icon: Plus, label: "Add", screen: null, action: onAdd, isFab: true },
    { icon: List, label: "Lists", screen: "lists" as Screen, action: onLists },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] max-w-[430px] mx-auto">
      <div className="bg-layer-0/95 backdrop-blur-md border-t border-layer-2 flex items-center justify-around px-4 pt-2 pb-safe pb-4">
        {items.map(({ icon: Icon, label, screen: s, action, isFab }) => {
          const isActive = s !== null && screen === s;

          if (isFab) {
            return (
              <button
                key={label}
                onClick={action}
                aria-label="Add task"
                className="w-12 h-12 rounded-[14px] bg-brand flex items-center justify-center shadow-fab active:scale-90 transition-transform -mt-4"
              >
                <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-1 px-4 py-1 relative"
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-brand-highlight" : "text-text-tag"
                  )}
                />
                {label === "Home" && hasOverdue && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-status-overdue border-2 border-layer-0" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-brand-highlight" : "text-text-tag"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
