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

// ─── Component ────────────────────────────────────────────────────────────────
export function Toast({ message, action }: ToastProps) {
  return (
    <div
      className={cn(
        "fixed top-5 left-1/2 -translate-x-1/2 z-[200]",
        "flex items-center gap-3",
        "px-4 py-2.5 rounded-pill shadow-dialog",
        "text-white text-[13px] font-medium",
        "transition-all duration-300",
        message
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      )}
      style={{ backgroundColor: "var(--color-bg-header)", border: "1px solid var(--color-border-default)" }}
    >
      {/* Message */}
      <span style={{ color: "var(--color-text-primary)" }}>
        {message}
      </span>

      {/* Action button — only shown when provided */}
      {action && message && (
        <>
          <div style={{
            width:           "1px",
            height:          "14px",
            backgroundColor: "var(--color-border-default)",
            flexShrink:      0,
          }} />
          <button
            onClick={action.onClick}
            style={{
              fontSize:        "var(--text-xs)",
              fontWeight:      700,
              color:           "var(--color-today)",
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