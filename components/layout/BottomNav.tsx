// // "use client";
// // import { Home, List, Plus, X } from "lucide-react";
// // import { cn } from "@/lib/cn";
// // import type { Screen } from "@/types";

// // interface BottomNavProps {
// //   screen: Screen;
// //   hasOverdue: boolean;
// //   quickAddOpen: boolean;
// //   onHome: () => void;
// //   onAdd: () => void;
// //   onLists: () => void;
// // }

// // export function BottomNav({
// //   screen,
// //   hasOverdue,
// //   quickAddOpen,
// //   onHome,
// //   onAdd,
// //   onLists,
// // }: BottomNavProps) {
// //   return (
// //     <nav
// //       className="relative z-[60] max-w-[430px] w-full mx-auto"
// //       style={{
// //         backgroundColor: "var(--color-bg-header)",
// //         borderTop: quickAddOpen
// //           ? "none"
// //           : "1px solid var(--color-border-default)",
// //       }}
// //     >
// //       <div className="flex items-center justify-around px-6 pt-2 pb-4">
// //         {/* Home */}
// //         <button
// //           onClick={onHome}
// //           className="flex flex-col items-center gap-1 px-4 py-1 min-w-[60px]"
// //         >
// //           <div className="relative">
// //             <Home
// //               className={cn(
// //                 "w-5 h-5 transition-colors",
// //                 screen === "home" && !quickAddOpen
// //                   ? "text-brand-highlight"
// //                   : "text-text-hint",
// //               )}
// //             />
// //             {hasOverdue && (
// //               <span
// //                 className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
// //                 style={{
// //                   backgroundColor: "var(--color-overdue)",
// //                   borderColor: "var(--color-bg-header)",
// //                 }}
// //               />
// //             )}
// //           </div>
// //           <span
// //             className={cn(
// //               "text-[10px] font-medium transition-colors",
// //               screen === "home" && !quickAddOpen
// //                 ? "text-brand-highlight"
// //                 : "text-text-hint",
// //             )}
// //           >
// //             Home
// //           </span>
// //         </button>

// //         {/* FAB — center */}
// //         <button
// //           onClick={onAdd}
// //           aria-label={quickAddOpen ? "Close quick add" : "Add task"}
// //           className="flex flex-col items-center gap-1 min-w-[60px]"
// //         >
// //           <div
// //             className="w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-300 active:scale-90"
// //             style={{
// //               backgroundColor: quickAddOpen
// //                 ? "var(--color-overdue)"
// //                 : "var(--color-primary)",
// //               boxShadow: "var(--shadow-fab)",
// //             }}
// //           >
// //             {/* Switch icon instead of rotating */}
// //             {quickAddOpen ? (
// //               <X className="w-6 h-6 text-white" strokeWidth={2.5} />
// //             ) : (
// //               <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
// //             )}
// //           </div>
// //           <span
// //             className="text-[10px] font-medium transition-colors"
// //             style={{
// //               color: quickAddOpen
// //                 ? "var(--color-overdue)"
// //                 : "var(--color-text-hint)",
// //             }}
// //           >
// //             {quickAddOpen ? "Close" : "Add"}
// //           </span>
// //         </button>

// //         {/* Lists */}
// //         <button
// //           onClick={onLists}
// //           className="flex flex-col items-center gap-1 px-4 py-1 min-w-[60px]"
// //         >
// //           <List
// //             className={cn(
// //               "w-5 h-5 transition-colors",
// //               screen === "lists" ? "text-brand-highlight" : "text-text-hint",
// //             )}
// //           />
// //           <span
// //             className={cn(
// //               "text-[10px] font-medium transition-colors",
// //               screen === "lists" ? "text-brand-highlight" : "text-text-hint",
// //             )}
// //           >
// //             Lists
// //           </span>
// //         </button>
// //       </div>
// //     </nav>
// //   );
// // }

// // components/layout/BottomNav.tsx
// "use client";
// import { Home, List, Plus, X } from "lucide-react";
// import { cn } from "@/lib/cn";
// import type { Screen } from "@/types";

// interface BottomNavProps {
//   screen:       Screen;
//   hasOverdue:   boolean;
//   quickAddOpen: boolean;
//   onHome:       () => void;
//   onAdd:        () => void;
//   onLists:      () => void;
// }

// export function BottomNav({
//   screen,
//   hasOverdue,
//   quickAddOpen,
//   onHome,
//   onAdd,
//   onLists,
// }: BottomNavProps) {
//   return (
//     <nav
//       className="relative z-[60] max-w-[430px] w-full mx-auto flex-shrink-0"
//       style={{
//         backgroundColor: "var(--color-bg-header)",
//         borderTop:       "1px solid var(--color-border-default)",
//         // Fill safe area on iPhone
//         paddingBottom:   "env(safe-area-inset-bottom, 0px)",
//       }}
//     >
//       <div
//         className="flex items-center justify-around px-6"
//         style={{ height: "64px" }}
//       >
//         {/* Home */}
//         <button
//           onClick={onHome}
//           className="flex flex-col items-center gap-1 px-4"
//         >
//           <div className="relative">
//             <Home
//               className={cn(
//                 "w-5 h-5 transition-colors",
//                 screen === "home" && !quickAddOpen
//                   ? "text-brand-highlight"
//                   : "text-text-hint"
//               )}
//             />
//             {hasOverdue && (
//               <span
//                 className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
//                 style={{
//                   backgroundColor: "var(--color-overdue)",
//                   borderColor:     "var(--color-bg-header)",
//                 }}
//               />
//             )}
//           </div>
//           <span
//             className={cn(
//               "text-[10px] font-medium transition-colors",
//               screen === "home" && !quickAddOpen
//                 ? "text-brand-highlight"
//                 : "text-text-hint"
//             )}
//           >
//             Home
//           </span>
//         </button>

//         {/* FAB */}
//         <button
//           onClick={onAdd}
//           aria-label={quickAddOpen ? "Close" : "Add task"}
//           className="flex flex-col items-center gap-1"
//         >
//           <div
//             className="w-12 h-12 rounded-[14px] flex items-center justify-center transition-colors duration-200 active:scale-90"
//             style={{
//               backgroundColor: quickAddOpen
//                 ? "var(--color-overdue)"
//                 : "var(--color-primary)",
//               boxShadow: "var(--shadow-fab)",
//             }}
//           >
//             {quickAddOpen
//               ? <X    className="w-6 h-6 text-white" strokeWidth={2.5} />
//               : <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
//             }
//           </div>
//           <span
//             className="text-[10px] font-medium"
//             style={{
//               color: quickAddOpen
//                 ? "var(--color-overdue)"
//                 : "var(--color-text-hint)",
//             }}
//           >
//             {quickAddOpen ? "Close" : "Add"}
//           </span>
//         </button>

//         {/* Lists */}
//         <button
//           onClick={onLists}
//           className="flex flex-col items-center gap-1 px-4"
//         >
//           <List
//             className={cn(
//               "w-5 h-5 transition-colors",
//               screen === "lists" ? "text-brand-highlight" : "text-text-hint"
//             )}
//           />
//           <span
//             className={cn(
//               "text-[10px] font-medium transition-colors",
//               screen === "lists" ? "text-brand-highlight" : "text-text-hint"
//             )}
//           >
//             Lists
//           </span>
//         </button>
//       </div>
//     </nav>
//   );
// }

// components/layout/BottomNav.tsx
"use client";

import { Home, List, Plus, X, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Screen } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
// Extended screen type to include settings + cdf
export type AppScreen = Screen | "settings" | "cdf";

interface BottomNavProps {
  screen: AppScreen;
  hasOverdue: boolean;
  quickAddOpen: boolean;
  onHome: () => void;
  onAdd: () => void;
  onLists: () => void;
  onSettings: () => void;
}

// ─── Nav item ─────────────────────────────────────────────────────────────────
function NavItem({
  icon,
  label,
  isActive,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 flex-1 py-1"
      style={{ background: "none", border: "none", cursor: "pointer" }}
    >
      <div className="relative">
        <div
          style={{
            color: isActive ? "var(--color-today)" : "var(--color-text-hint)",
            transition: "color 0.2s ease",
          }}
        >
          {icon}
        </div>

        {/* Badge dot */}
        {badge && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
            style={{
              backgroundColor: "var(--color-overdue)",
              borderColor: "var(--color-bg-header)",
            }}
          />
        )}
      </div>

      <span
        style={{
          fontSize: "10px",
          fontWeight: isActive ? 700 : 500,
          color: isActive ? "var(--color-today)" : "var(--color-text-hint)",
          transition: "color 0.2s ease",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── FAB ──────────────────────────────────────────────────────────────────────
function FabButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close quick add" : "Add task"}
      className="flex flex-col items-center gap-1 flex-1 py-1"
      style={{ background: "none", border: "none", cursor: "pointer" }}
    >
      <div
        className="flex items-center justify-center transition-colors duration-200 active:scale-90"
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "14px",
          backgroundColor: isOpen
            ? "var(--color-overdue)"
            : "var(--color-primary)",
          boxShadow: isOpen
            ? "0 4px 16px rgba(229,57,53,0.4)"
            : "var(--shadow-fab)",
          transition: "background-color 0.2s ease, box-shadow 0.2s ease",
          marginTop: "-8px", // lift FAB above nav line
        }}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" strokeWidth={2.5} />
        ) : (
          <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
        )}
      </div>
      <span
        style={{
          fontSize: "10px",
          fontWeight: 500,
          color: isOpen ? "var(--color-overdue)" : "var(--color-text-hint)",
          transition: "color 0.2s ease",
          marginTop: "2px",
        }}
      >
        {isOpen ? "Close" : "Add"}
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function BottomNav({
  screen,
  hasOverdue,
  quickAddOpen,
  onHome,
  onAdd,
  onLists,
  onSettings,
}: BottomNavProps) {
  return (
    <nav
      className="relative z-[60] max-w-[430px] w-full mx-auto flex-shrink-0"
      style={{
        backgroundColor: "var(--color-bg-header)",
        borderTop: "1px solid var(--color-border-default)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className="flex items-end justify-around px-2"
        style={{ height: "60px" }}
      >
        {/* Home */}
        <NavItem
          icon={<Home className="w-5 h-5" />}
          label="Home"
          isActive={screen === "home" && !quickAddOpen}
          onClick={onHome}
          badge={hasOverdue}
        />

        {/* Lists */}
        <NavItem
          icon={<List className="w-5 h-5" />}
          label="Lists"
          isActive={screen === "lists"}
          onClick={onLists}
        />

        {/* FAB — center */}
        <FabButton isOpen={quickAddOpen} onClick={onAdd} />

        {/* CDF / Settings link — navigates to /cdf via settings */}
        <NavItem
          icon={
            <div
              className="flex items-center justify-center rounded-[6px]"
              style={{
                width: "20px",
                height: "20px",
                backgroundColor:
                  screen === "cdf" || screen === "settings"
                    ? "rgba(41,182,246,0.15)"
                    : "transparent",
              }}
            >
              <span style={{ fontSize: "13px", lineHeight: 1 }}>⚡</span>
            </div>
          }
          label="CDF"
          isActive={screen === "cdf"}
          onClick={() => {
            // Navigate to CDF page
            window.location.href = "/cdf";
          }}
        />

        {/* Settings */}
        <NavItem
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
          isActive={screen === "settings"}
          onClick={onSettings}
        />
      </div>
    </nav>
  );
}
