// components/ui/CacheIndicator.tsx
"use client";

import { RefreshCw } from "lucide-react";

interface CacheIndicatorProps {
  isFromCache: boolean;
  isLoading:   boolean;
}

export function CacheIndicator({
  isFromCache,
  isLoading,
}: CacheIndicatorProps) {
  if (!isFromCache && !isLoading) return null;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1"
      style={{
        backgroundColor: "rgba(21,101,168,0.08)",
        borderBottom:    "1px solid var(--color-border-default)",
      }}
    >
      <RefreshCw
        style={{
          width:  "11px",
          height: "11px",
          color:  "var(--color-text-hint)",
        }}
        className={isLoading ? "animate-spin" : ""}
      />
      <span style={{
        fontSize: "var(--text-xs)",
        color:    "var(--color-text-hint)",
      }}>
        {isLoading && isFromCache
          ? "Updating in background…"
          : isFromCache
          ? "Showing cached data"
          : "Refreshing…"
        }
      </span>
    </div>
  );
}