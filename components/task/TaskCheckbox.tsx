// components/task/TaskCheckbox.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";

interface TaskCheckboxProps {
  taskId: string;
  completed: boolean;
  onToggle: (taskId: string) => Promise<void>;
  isToggling?: boolean;
  disabled?: boolean;
}

export function TaskCheckbox({
  taskId,
  completed,
  onToggle,
  isToggling = false,
  disabled = false,
}: TaskCheckboxProps) {
  // Local optimistic state — updates instantly on click
  const [localChecked, setLocalChecked] = useState(completed);

  // Sync with parent if external change happens
  useEffect(() => {
    setLocalChecked(completed);
  }, [completed]);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      // Stop propagation — don't open task detail on checkbox click
      e.stopPropagation();
      if (disabled || isToggling) return;

      // Optimistic update — instant feedback
      setLocalChecked((prev) => !prev);

      try {
        await onToggle(taskId);
      } catch {
        // Revert on failure
        setLocalChecked((prev) => !prev);
      }
    },
    [taskId, disabled, isToggling, onToggle],
  );

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={localChecked}
      aria-label={localChecked ? "Mark as incomplete" : "Mark as complete"}
      onClick={handleClick}
      disabled={disabled || isToggling}
      className="flex-shrink-0 transition-all duration-200 active:scale-90 focus:outline-none"
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "6px",
        border: `2px solid ${
          localChecked ? "var(--color-success)" : "var(--color-border-default)"
        }`,
        backgroundColor: localChecked ? "var(--color-success)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled || isToggling ? "not-allowed" : "pointer",
        transition:
          "background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
      }}
    >
      {isToggling ? (
        <Loader2
          className="animate-spin"
          style={{
            width: "12px",
            height: "12px",
            color: localChecked ? "#ffffff" : "var(--color-text-hint)",
          }}
        />
      ) : localChecked ? (
        <Check
          strokeWidth={3}
          style={{
            width: "13px",
            height: "13px",
            color: "#ffffff",
            // Pop-in animation
            animation: "checkPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        />
      ) : null}
    </button>
  );
}
