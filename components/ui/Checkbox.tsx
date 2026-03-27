"use client";
import { cn } from "@/lib/cn";

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export function Checkbox({ checked, onChange, className }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onChange(); }}
      aria-checked={checked}
      role="checkbox"
      className={cn(
        "w-[22px] h-[22px] rounded-[6px] border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 active:scale-90",
        checked
          ? "bg-status-completed border-status-completed animate-check-pop"
          : "bg-transparent border-layer-3",
        className
      )}
    >
      {checked && (
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none" className="animate-check-pop">
          <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
