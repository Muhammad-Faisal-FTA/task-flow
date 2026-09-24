// components/ui/CacheIndicator.tsx
"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface CacheIndicatorProps {
  isFromCache: boolean;
  isLoading:   boolean;
}

export function CacheIndicator({
  isFromCache,
  isLoading,
}: CacheIndicatorProps) {
  const [visible, setVisible] = useState(isFromCache || isLoading);

  useEffect(() => {
    setVisible(true);
    if (isLoading || !isFromCache) return;

    const timeout = window.setTimeout(() => setVisible(false), 1000);
    return () => window.clearTimeout(timeout);
  }, [isFromCache, isLoading]);

  if (!visible || (!isFromCache && !isLoading)) return null;

  return (
    <div
      className="absolute inset-x-0 top-0 z-40 flex items-center gap-1.5 px-3 py-1 transition-opacity duration-1000"
      style={{
        opacity: visible ? 1 : 0,
        backgroundColor: "color-mix(in srgb, var(--color-bg-header) 92%, transparent)",
        borderBottom:    "1px solid var(--color-border-default)",
        pointerEvents: "none",
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