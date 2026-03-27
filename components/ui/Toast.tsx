"use client";
import { cn } from "@/lib/cn";

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      className={cn(
        "fixed top-5 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-pill bg-status-completed text-white text-[13px] font-medium shadow-dialog transition-all duration-300",
        message ? "opacity-100 -translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}
    >
      {message}
    </div>
  );
}
