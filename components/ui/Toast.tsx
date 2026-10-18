// "use client";
// import { cn } from "@/lib/cn";

// interface ToastProps {
//   message: string | null;
// }

// export function Toast({ message }: ToastProps) {
//   return (
//     <div
//       className={cn(
//         "fixed top-5 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-pill bg-status-completed text-white text-[13px] font-medium shadow-dialog transition-all duration-300",
//         message ? "opacity-100 -translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
//       )}
//     >
//       {message}
//     </div>
//   );
// }


// components/ui/Toast.tsx
"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ToastAction {
  label:   string;
  onClick: () => void;
}

interface ToastProps {
  message: string | null;
  action?: ToastAction;
}

function playNotificationSound(): void {
  if (typeof window === "undefined" || !window.AudioContext) return;

  const audioContext = new window.AudioContext();
  const playTone = () => {
    if (audioContext.state !== "running") {
      void audioContext.close();
      return;
    }

    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, now);
    volume.gain.setValueAtTime(0.08, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
    oscillator.onended = () => void audioContext.close();
  };

  if (audioContext.state === "running") {
    playTone();
  } else {
    void audioContext.resume().then(playTone).catch((error: unknown) => {
      console.warn("[Toast] Unable to play notification sound:", error);
      void audioContext.close();
    });
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Toast({ message, action }: ToastProps) {
  useEffect(() => {
    if (message) playNotificationSound();
  }, [message]);

  return (
    <div
      className={cn(
        "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200]",
        "flex items-center gap-3",
        "w-max max-w-[calc(100vw-2rem)] px-4 py-2.5 rounded-pill shadow-dialog",
        "text-white text-[13px] font-medium",
        "transition-all duration-300",
        message
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
      )}
      style={{
        backgroundColor: "var(--color-primary)",
        border: "1px solid var(--color-accent)",
        boxShadow: "var(--shadow-dialog), 0 0 18px color-mix(in srgb, var(--color-primary) 45%, transparent)",
      }}
    >
      {/* Message */}
      <span style={{ color: "#ffffff" }}>
        {message}
      </span>

      {/* Action button — only shown when provided */}
      {action && message && (
        <>
          <div style={{
            width:           "1px",
            height:          "14px",
            backgroundColor: "rgba(255, 255, 255, 0.55)",
            flexShrink:      0,
          }} />
          <button
            onClick={action.onClick}
            style={{
              fontSize:        "var(--text-xs)",
              fontWeight:      700,
              color:           "#ffffff",
              background:      "none",
              border:          "none",
              cursor:          "pointer",
              padding:         "0",
              flexShrink:      0,
              whiteSpace:      "nowrap",
            }}
          >
            {action.label}
          </button>
        </>
      )}
    </div>
  );
}