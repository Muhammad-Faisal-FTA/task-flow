// components/ui/OfflineBanner.tsx
"use client";

import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface OfflineBannerProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

export function OfflineBanner({
  isOnline,
  isSyncing,
  pendingCount,
}: OfflineBannerProps) {
  if (isOnline && !isSyncing && pendingCount === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "430px",
        zIndex: 999,
        backgroundColor: isOnline
          ? isSyncing
            ? "var(--color-primary)"
            : "var(--color-success)"
          : "var(--color-overdue)",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "background-color 0.3s ease",
      }}
    >
      {isOnline ? (
        isSyncing ? (
          <>
            <RefreshCw
              style={{ width: "13px", height: "13px", color: "#fff" }}
              className="animate-spin"
            />
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Syncing {pendingCount > 0 ? `${pendingCount} changes` : ""}…
            </span>
          </>
        ) : (
          <>
            <Wifi style={{ width: "13px", height: "13px", color: "#fff" }} />
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Back online — all changes synced ✓
            </span>
          </>
        )
      ) : (
        <>
          <WifiOff style={{ width: "13px", height: "13px", color: "#fff" }} />
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            You're offline — changes will sync when reconnected
          </span>
        </>
      )}
    </div>
  );
}
