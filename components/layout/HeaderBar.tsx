"use client";
import { ChevronLeft, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";

interface HeaderBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export function HeaderBar({ title, showBack, onBack, rightAction, className }: HeaderBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex items-center gap-3 px-4 py-3.5 bg-layer-1 border-b border-layer-2",
        className
      )}
    >
      {showBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-brand-highlight text-[14px] font-medium active:opacity-60 transition-opacity -ml-1"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
      )}

      <h1
        className={cn(
          "flex-1 font-bold text-[18px] text-text-primary",
          showBack ? "text-center" : "text-left"
        )}
        style={{ fontFamily: "'Product Sans', Roboto, sans-serif" }}
      >
        {title}
      </h1>

      {rightAction && <div className="ml-auto">{rightAction}</div>}
    </header>
  );
}
