// components/task/SearchBar.tsx
"use client";

import { useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  open: boolean;
  query: string;
  isSearching: boolean;
  onChange: (q: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function SearchBar({
  open,
  query,
  isSearching,
  onChange,
  onClear,
  onClose,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 60,
        overflow: "hidden",
        maxHeight: open ? "80px" : "0px",
        opacity: open ? 1 : 0,
        transition:
          "max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
        backgroundColor: "var(--color-bg-header)",
        borderBottom: open ? "1px solid var(--color-border-default)" : "none",
      }}
    >
      <div className="flex items-center gap-3 px-4" style={{ height: "56px" }}>
        {/* Search icon / spinner */}
        <div style={{ flexShrink: 0 }}>
          {isSearching ? (
            <Loader2
              className="animate-spin"
              style={{
                width: "18px",
                height: "18px",
                color: "var(--color-primary)",
              }}
            />
          ) : (
            <Search
              style={{
                width: "18px",
                height: "18px",
                color: query
                  ? "var(--color-primary)"
                  : "var(--color-text-hint)",
              }}
            />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          placeholder="Search tasks…"
          className="flex-1 bg-transparent outline-none"
          style={{
            fontSize: "var(--text-base)",
            color: "var(--color-text-primary)",
            caretColor: "var(--color-accent)",
          }}
          aria-label="Search tasks"
        />

        {/* Clear button — shows when query not empty */}
        {query && (
          <button
            onClick={onClear}
            className="active:scale-90 transition-transform"
            style={{ flexShrink: 0 }}
            aria-label="Clear search"
          >
            <X
              style={{
                width: "18px",
                height: "18px",
                color: "var(--color-text-hint)",
              }}
            />
          </button>
        )}

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "20px",
            backgroundColor: "var(--color-border-default)",
            flexShrink: 0,
          }}
        />

        {/* Close / cancel */}
        <button
          onClick={onClose}
          className="active:scale-90 transition-transform"
          style={{
            flexShrink: 0,
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-accent)",
            whiteSpace: "nowrap",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
