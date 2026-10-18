// components/ui/NotificationBanner.tsx
"use client";

import { Bell, BellOff, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useState } from "react";

export function NotificationBanner() {
  const {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [dismissed, setDismissed] = useState(false);

  // Don't show if: unsupported, dismissed, already subscribed, or denied
  if (
    dismissed         ||
    isSubscribed      ||
    permission === "unsupported" ||
    permission === "denied"      ||
    permission === "granted"
  ) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        backgroundColor: "var(--color-primary)",
        borderBottom:    "2px solid var(--color-accent)",
      }}
    >
      <Bell
        style={{ width: "16px", height: "16px", color: "#ffffff", flexShrink: 0 }}
      />

      <p style={{ flex: 1, fontSize: "var(--text-sm)", color: "#ffffff" }}>
        Enable notifications to get reminders when tasks are due.
      </p>

      <button
        onClick={subscribe}
        disabled={isLoading}
        style={{
          padding:         "5px 12px",
          borderRadius:    "var(--radius-btn)",
          fontSize:        "var(--text-xs)",
          fontWeight:      700,
          backgroundColor: "#ffffff",
          color:           "var(--color-primary)",
          border:          "none",
          cursor:          isLoading ? "not-allowed" : "pointer",
          opacity:         isLoading ? 0.7 : 1,
          flexShrink:      0,
          whiteSpace:      "nowrap",
        }}
      >
        {isLoading ? "Enabling…" : "Enable"}
      </button>

      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "none",
          border:     "none",
          cursor:     "pointer",
          padding:    "4px",
          color:      "#ffffff",
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        <X style={{ width: "14px", height: "14px" }} />
      </button>
    </div>
  );
}