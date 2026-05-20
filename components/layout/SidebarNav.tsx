// components/layout/SidebarNav.tsx
"use client";

import { useRouter } from "next/navigation";
import { Home, List, Plus, Settings, BarChart2, X } from "lucide-react";
import type { AppScreen } from "@/components/layout/BottomNav";

interface SidebarNavProps {
  screen: AppScreen;
  hasOverdue: boolean;
  quickAddOpen: boolean;
  onHome: () => void;
  onAdd: () => void;
  onLists: () => void;
  onSettings: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: boolean;
}

function NavItem({ icon, label, isActive, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-card transition-all duration-200 active:scale-[0.98] group"
      style={{
        backgroundColor: isActive ? "rgba(30,139,195,0.15)" : "transparent",
        border: isActive
          ? "1px solid rgba(30,139,195,0.3)"
          : "1px solid transparent",
      }}
    >
      {/* Icon */}
      <div className="relative flex-shrink-0">
        <div
          style={{
            color: isActive ? "var(--color-today)" : "var(--color-text-hint)",
            transition: "color 0.2s",
          }}
        >
          {icon}
        </div>
        {badge && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full border-2"
            style={{
              backgroundColor: "var(--color-overdue)",
              borderColor: "var(--color-bg-header)",
            }}
          />
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: "var(--text-base)",
          fontWeight: isActive ? 700 : 500,
          color: isActive
            ? "var(--color-today)"
            : "var(--color-text-secondary)",
          transition: "color 0.2s",
        }}
      >
        {label}
      </span>

      {/* Active indicator */}
      {isActive && (
        <div
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "var(--color-today)" }}
        />
      )}
    </button>
  );
}

export function SidebarNav({
  screen,
  hasOverdue,
  quickAddOpen,
  onHome,
  onAdd,
  onLists,
  onSettings,
}: SidebarNavProps) {
  const router = useRouter();

  return (
    <aside
      style={{
        width: "220px",
        flexShrink: 0,
        backgroundColor: "var(--color-bg-header)",
        borderRight: "1px solid var(--color-border-default)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 12px",
        gap: "4px",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 12px 24px" }}>
        <p
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.5px",
          }}
        >
          ✓ TaskFlow
        </p>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-hint)",
            marginTop: "2px",
          }}
        >
          Stay consistent. Stay focused.
        </p>
      </div>

      {/* Nav items */}
      <NavItem
        icon={<Home className="w-5 h-5" />}
        label="Home"
        isActive={screen === "home" && !quickAddOpen}
        onClick={onHome}
        badge={hasOverdue}
      />

      <NavItem
        icon={<List className="w-5 h-5" />}
        label="Task Lists"
        isActive={screen === "lists"}
        onClick={onLists}
      />

      <NavItem
        icon={<BarChart2 className="w-5 h-5" />}
        label="CDF Tracker"
        isActive={screen === "cdf"}
        onClick={() => router.push("/cdf")}
      />

      <NavItem
        icon={<Settings className="w-5 h-5" />}
        label="Settings"
        isActive={screen === "settings"}
        onClick={onSettings}
      />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Add task button — bottom of sidebar */}
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-card active:scale-[0.98] transition-transform"
        style={{
          backgroundColor: quickAddOpen
            ? "var(--color-overdue)"
            : "var(--color-primary)",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "var(--text-base)",
          boxShadow: "var(--shadow-fab)",
          border: "none",
          cursor: "pointer",
        }}
      >
        {quickAddOpen ? (
          <>
            <X className="w-4 h-4" /> Close
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" /> Add Task
          </>
        )}
      </button>
    </aside>
  );
}

// // components/task/QuickAddBar.tsx
// "use client";

// import { useRef, useEffect, useCallback } from "react";
// import { Mic, MicOff, Plus, Loader2, X } from "lucide-react";
// import { useQuickAdd } from "@/hooks/useQuickAdd";
// import { useVoiceInput } from "@/hooks/useVoiceInput";
// import type { TaskDTO } from "@/types/task";

// interface QuickAddBarProps {
//   open: boolean;
//   onTaskCreated?: (task: TaskDTO) => void;
//   onError?: (message: string) => void;
//   onClose?: () => void;
// }

// export function QuickAddBar({
//   open,
//   onTaskCreated,
//   onError,
//   onClose,
// }: QuickAddBarProps) {
//   const inputRef = useRef<HTMLInputElement>(null);

//   const { value, setValue, isSubmitting, isLoading, submit, defaultList } =
//     useQuickAdd({
//       onSuccess: (task) => {
//         onTaskCreated?.(task);
//       },
//       onError,
//     });

//   const {
//     state: voiceState,
//     isListening,
//     isSupported: isVoiceSupported,
//     toggle: toggleVoice,
//   } = useVoiceInput({
//     onResult: useCallback(
//       (transcript: string) => {
//         setValue(transcript);
//         inputRef.current?.focus();
//       },
//       [setValue],
//     ),
//     onError,
//     language: "en-US",
//   });

//   // Auto focus when opened
//   useEffect(() => {
//     if (open) setTimeout(() => inputRef.current?.focus(), 200);
//   }, [open]);

//   const handleKeyDown = useCallback(
//     (e: React.KeyboardEvent<HTMLInputElement>) => {
//       if (e.key === "Enter" && !e.shiftKey) {
//         e.preventDefault();
//         submit();
//       }
//       if (e.key === "Escape") onClose?.();
//     },
//     [submit, onClose],
//   );

//   const voiceLabel =
//     voiceState === "listening"
//       ? "Listening…"
//       : voiceState === "processing"
//         ? "Processing…"
//         : voiceState === "error"
//           ? "Try again"
//           : null;

//   const placeholder = isLoading
//     ? "Loading…"
//     : isListening
//       ? "Speak now…"
//       : defaultList
//         ? `Add to ${defaultList.name}…`
//         : "Enter a task…";

//   if (!open) return null;

//   return (
//     <>
//       {/* ── Backdrop — always shown ───────────────────────────────────── */}
//       <div
//         onClick={onClose}
//         style={{
//           position: "fixed",
//           inset: 0,
//           zIndex: 100,
//           backgroundColor: "rgba(0,0,0,0.6)",
//           backdropFilter: "blur(2px)",
//         }}
//       />

//       {/* ── Panel ─────────────────────────────────────────────────────── */}
//       {/* Mobile: slides from bottom. Desktop: centered modal             */}
//       <div
//         style={{
//           position: "fixed",
//           zIndex: 101,
//           // ── Mobile: bottom sheet ──
//           bottom: 0,
//           left: "50%",
//           transform: "translateX(-50%)",
//           width: "100%",
//           maxWidth: "430px",
//           backgroundColor: "var(--color-bg-header)",
//           borderRadius: "20px 20px 0 0",
//           borderTop: "1px solid var(--color-border-default)",
//           boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
//           paddingBottom: "env(safe-area-inset-bottom, 8px)",
//           animation: "slideUpPanel 0.3s cubic-bezier(0.4,0,0.2,1) both",
//         }}
//         // Override to centered modal on desktop via inline media query workaround
//         className="md:bottom-auto md:top-1/2 md:left-1/2 md:rounded-card md:border md:border-[var(--color-border-default)] md:max-w-lg md:w-[480px]"
//       >
//         {/* Drag handle — mobile only */}
//         <div className="flex justify-center pt-3 pb-1 md:hidden">
//           <div
//             style={{
//               width: "36px",
//               height: "4px",
//               borderRadius: "2px",
//               backgroundColor: "var(--color-border-default)",
//             }}
//           />
//         </div>

//         {/* Header */}
//         <div
//           className="flex items-center justify-between px-4 py-3"
//           style={{ borderBottom: "1px solid var(--color-border-default)" }}
//         >
//           <p
//             style={{
//               fontSize: "var(--text-xs)",
//               fontWeight: 700,
//               letterSpacing: "1.5px",
//               textTransform: "uppercase",
//               color: "var(--color-text-accent)",
//             }}
//           >
//             Quick Add Task
//           </p>

//           {/* Close button — desktop */}
//           <button
//             onClick={onClose}
//             className="w-7 h-7 flex items-center justify-center rounded-[6px] active:scale-90 transition-transform"
//             style={{
//               backgroundColor: "var(--color-bg-card)",
//               border: "1px solid var(--color-border-default)",
//               color: "var(--color-text-hint)",
//               cursor: "pointer",
//             }}
//           >
//             <X style={{ width: "14px", height: "14px" }} />
//           </button>
//         </div>

//         {/* Voice banner */}
//         {voiceLabel && (
//           <div
//             className="flex items-center justify-center gap-2 mx-4 mt-3 rounded-card"
//             style={{
//               fontSize: "var(--text-sm)",
//               padding: "8px",
//               backgroundColor: "var(--color-bg-card)",
//               color:
//                 voiceState === "error"
//                   ? "var(--color-overdue)"
//                   : "var(--color-accent)",
//             }}
//           >
//             {voiceState === "listening" && (
//               <span
//                 className="w-2 h-2 rounded-full animate-pulse"
//                 style={{ backgroundColor: "var(--color-overdue)" }}
//               />
//             )}
//             {voiceLabel}
//           </div>
//         )}

//         {/* Input + buttons */}
//         <div className="flex items-center gap-2 px-4 py-4">
//           {/* Text input */}
//           <div className="flex-1 relative min-w-0">
//             <input
//               ref={inputRef}
//               type="text"
//               value={value}
//               onChange={(e) => setValue(e.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder={placeholder}
//               disabled={isSubmitting || isLoading || !open}
//               maxLength={255}
//               className="auth-input w-full"
//               style={{
//                 paddingTop: "11px",
//                 paddingBottom: "11px",
//                 fontSize: "var(--text-base)",
//                 paddingRight: value.length > 200 ? "44px" : "14px",
//               }}
//             />
//             {value.length > 200 && (
//               <span
//                 className="absolute right-3 top-1/2 -translate-y-1/2"
//                 style={{
//                   fontSize: "var(--text-xs)",
//                   color:
//                     value.length > 240
//                       ? "var(--color-overdue)"
//                       : "var(--color-text-hint)",
//                 }}
//               >
//                 {255 - value.length}
//               </span>
//             )}
//           </div>

//           {/* Voice button */}
//           {isVoiceSupported && (
//             <button
//               type="button"
//               onClick={toggleVoice}
//               disabled={isSubmitting}
//               className="flex-shrink-0 active:scale-90 transition-transform"
//               style={{
//                 width: "44px",
//                 height: "44px",
//                 minWidth: "44px",
//                 borderRadius: "var(--radius-input)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 backgroundColor: isListening
//                   ? "rgba(229,57,53,0.15)"
//                   : "var(--color-bg-card)",
//                 border: `1.5px solid ${
//                   isListening
//                     ? "var(--color-overdue)"
//                     : "var(--color-border-default)"
//                 }`,
//                 color: isListening
//                   ? "var(--color-overdue)"
//                   : "var(--color-text-hint)",
//                 cursor: "pointer",
//               }}
//             >
//               {isListening ? (
//                 <MicOff className="w-[18px] h-[18px]" />
//               ) : (
//                 <Mic className="w-[18px] h-[18px]" />
//               )}
//             </button>
//           )}

//           {/* Submit button */}
//           <button
//             type="button"
//             onClick={submit}
//             disabled={!value.trim() || isSubmitting || isLoading}
//             className="flex-shrink-0 active:scale-90 transition-transform"
//             style={{
//               width: "44px",
//               height: "44px",
//               minWidth: "44px",
//               borderRadius: "var(--radius-input)",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               backgroundColor:
//                 value.trim() && !isSubmitting
//                   ? "var(--color-primary)"
//                   : "var(--color-bg-card)",
//               border: "1.5px solid var(--color-border-default)",
//               color:
//                 value.trim() && !isSubmitting
//                   ? "#ffffff"
//                   : "var(--color-text-hint)",
//               opacity: !value.trim() || isSubmitting ? 0.5 : 1,
//               cursor: !value.trim() || isSubmitting ? "not-allowed" : "pointer",
//               transition: "background-color 0.2s, opacity 0.2s",
//             }}
//           >
//             {isSubmitting ? (
//               <Loader2 className="w-[18px] h-[18px] animate-spin" />
//             ) : (
//               <Plus className="w-[18px] h-[18px]" />
//             )}
//           </button>
//         </div>

//         {/* Default list indicator */}
//         {defaultList && (
//           <div className="flex items-center gap-2 px-4 pb-4">
//             <div
//               className="w-2 h-2 rounded-full flex-shrink-0"
//               style={{
//                 backgroundColor: defaultList.color ?? "var(--color-primary)",
//               }}
//             />
//             <span
//               style={{
//                 fontSize: "var(--text-xs)",
//                 color: "var(--color-text-hint)",
//               }}
//             >
//               Adding to{" "}
//               <strong style={{ color: "var(--color-text-secondary)" }}>
//                 {defaultList.name}
//               </strong>
//             </span>
//           </div>
//         )}
//       </div>

//       {/* ── Slide up animation ────────────────────────────────────────── */}
//       <style>{`
//         @keyframes slideUpPanel {
//           from { transform: translateX(-50%) translateY(100%); opacity: 0; }
//           to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
//         }
//         @media (min-width: 768px) {
//           @keyframes slideUpPanel {
//             from { transform: translate(-50%, calc(-50% + 20px)); opacity: 0; }
//             to   { transform: translate(-50%, -50%);               opacity: 1; }
//           }
//         }
//       `}</style>
//     </>
//   );
// }
