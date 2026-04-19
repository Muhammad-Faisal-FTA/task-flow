// "use client";
// import { Home, Plus, List } from "lucide-react";
// import { cn } from "@/lib/cn";
// import type { Screen } from "@/types";

// interface BottomNavProps {
//   screen: Screen;
//   hasOverdue: boolean;
//   onHome: () => void;
//   onAdd: () => void;
//   onLists: () => void;
// }

// export function BottomNav({ screen, hasOverdue, onHome, onAdd, onLists }: BottomNavProps) {
//   const items = [
//     { icon: Home, label: "Home", screen: "home" as Screen, action: onHome },
//     { icon: Plus, label: "Add", screen: null, action: onAdd, isFab: true },
//     { icon: List, label: "Lists", screen: "lists" as Screen, action: onLists },
//   ];

//   return (
//     <nav className="fixed bottom-0 left-0 right-0 z-[90] max-w-[430px] mx-auto">
//       <div className="bg-layer-0/95 backdrop-blur-md border-t border-layer-2 flex items-center justify-around px-4 pt-2 pb-safe pb-4">
//         {items.map(({ icon: Icon, label, screen: s, action, isFab }) => {
//           const isActive = s !== null && screen === s;

//           if (isFab) {
//             return (
//               <button
//                 key={label}
//                 onClick={action}
//                 aria-label="Add task"
//                 className="w-12 h-12 rounded-[14px] bg-brand flex items-center justify-center shadow-fab active:scale-90 transition-transform -mt-4"
//               >
//                 <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
//               </button>
//             );
//           }

//           return (
//             <button
//               key={label}
//               onClick={action}
//               className="flex flex-col items-center gap-1 px-4 py-1 relative"
//             >
//               <div className="relative">
//                 <Icon
//                   className={cn(
//                     "w-5 h-5 transition-colors",
//                     isActive ? "text-brand-highlight" : "text-text-tag"
//                   )}
//                 />
//                 {label === "Home" && hasOverdue && (
//                   <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-status-overdue border-2 border-layer-0" />
//                 )}
//               </div>
//               <span
//                 className={cn(
//                   "text-[10px] font-medium transition-colors",
//                   isActive ? "text-brand-highlight" : "text-text-tag"
//                 )}
//               >
//                 {label}
//               </span>
//             </button>
//           );
//         })}
//       </div>
//     </nav>
//   );
// }

// "use client";
// import { Home, List, Plus, X } from "lucide-react";
// import { cn } from "@/lib/cn";
// import type { Screen } from "@/types";

// interface BottomNavProps {
//   screen: Screen;
//   hasOverdue: boolean;
//   quickAddOpen: boolean; // ← new — FAB shows X when open
//   onHome: () => void;
//   onAdd: () => void;
//   onLists: () => void;
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
//       className="relative z-[90] max-w-[430px] w-full mx-auto"
//       style={{
//         backgroundColor: "var(--color-bg-header)",
//         borderTop: "1px solid var(--color-border-default)",
//       }}
//     >
//       <div className="flex items-center justify-around px-6 pt-3 pb-safe pb-4">
//         {/* Home */}
//         <button
//           onClick={onHome}
//           className="flex flex-col items-center gap-1 px-4 py-1"
//         >
//           <div className="relative">
//             <Home
//               className={cn(
//                 "w-5 h-5 transition-colors",
//                 screen === "home" && !quickAddOpen
//                   ? "text-brand-highlight"
//                   : "text-text-hint",
//               )}
//             />
//             {hasOverdue && (
//               <span
//                 className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
//                 style={{
//                   backgroundColor: "var(--color-overdue)",
//                   borderColor: "var(--color-bg-header)",
//                 }}
//               />
//             )}
//           </div>
//           <span
//             className={cn(
//               "text-[10px] font-medium transition-colors",
//               screen === "home" && !quickAddOpen
//                 ? "text-brand-highlight"
//                 : "text-text-hint",
//             )}
//           >
//             Home
//           </span>
//         </button>

//         {/* FAB — center */}
//         <button
//           onClick={onAdd}
//           aria-label={quickAddOpen ? "Close quick add" : "Add task"}
//           className="flex flex-col items-center gap-1 -mt-5"
//         >
//           <div
//             className="w-14 h-14 rounded-[18px] flex items-center justify-center transition-all duration-300 active:scale-90"
//             style={{
//               backgroundColor: quickAddOpen
//                 ? "var(--color-overdue)"
//                 : "var(--color-primary)",
//               boxShadow: "var(--shadow-fab)",
//               transform: quickAddOpen ? "rotate(45deg)" : "rotate(0deg)",
//               transition:
//                 "background-color 0.2s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
//             }}
//           >
//             <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
//           </div>
//           <span
//             className="text-[10px] font-medium transition-colors"
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
//           className="flex flex-col items-center gap-1 px-4 py-1"
//         >
//           <List
//             className={cn(
//               "w-5 h-5 transition-colors",
//               screen === "lists" ? "text-brand-highlight" : "text-text-hint",
//             )}
//           />
//           <span
//             className={cn(
//               "text-[10px] font-medium transition-colors",
//               screen === "lists" ? "text-brand-highlight" : "text-text-hint",
//             )}
//           >
//             Lists
//           </span>
//         </button>
//       </div>
//     </nav>
//   );
// }

"use client";
import { Home, List, Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Screen } from "@/types";

interface BottomNavProps {
  screen: Screen;
  hasOverdue: boolean;
  quickAddOpen: boolean;
  onHome: () => void;
  onAdd: () => void;
  onLists: () => void;
}

export function BottomNav({
  screen,
  hasOverdue,
  quickAddOpen,
  onHome,
  onAdd,
  onLists,
}: BottomNavProps) {
  return (
    <nav
      className="relative z-[60] max-w-[430px] w-full mx-auto"
      style={{
        backgroundColor: "var(--color-bg-header)",
        borderTop: quickAddOpen
          ? "none"
          : "1px solid var(--color-border-default)",
      }}
    >
      <div className="flex items-center justify-around px-6 pt-2 pb-4">
        {/* Home */}
        <button
          onClick={onHome}
          className="flex flex-col items-center gap-1 px-4 py-1 min-w-[60px]"
        >
          <div className="relative">
            <Home
              className={cn(
                "w-5 h-5 transition-colors",
                screen === "home" && !quickAddOpen
                  ? "text-brand-highlight"
                  : "text-text-hint",
              )}
            />
            {hasOverdue && (
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
            className={cn(
              "text-[10px] font-medium transition-colors",
              screen === "home" && !quickAddOpen
                ? "text-brand-highlight"
                : "text-text-hint",
            )}
          >
            Home
          </span>
        </button>

        {/* FAB — center */}
        <button
          onClick={onAdd}
          aria-label={quickAddOpen ? "Close quick add" : "Add task"}
          className="flex flex-col items-center gap-1 min-w-[60px]"
        >
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-300 active:scale-90"
            style={{
              backgroundColor: quickAddOpen
                ? "var(--color-overdue)"
                : "var(--color-primary)",
              boxShadow: "var(--shadow-fab)",
            }}
          >
            {/* Switch icon instead of rotating */}
            {quickAddOpen ? (
              <X className="w-6 h-6 text-white" strokeWidth={2.5} />
            ) : (
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            )}
          </div>
          <span
            className="text-[10px] font-medium transition-colors"
            style={{
              color: quickAddOpen
                ? "var(--color-overdue)"
                : "var(--color-text-hint)",
            }}
          >
            {quickAddOpen ? "Close" : "Add"}
          </span>
        </button>

        {/* Lists */}
        <button
          onClick={onLists}
          className="flex flex-col items-center gap-1 px-4 py-1 min-w-[60px]"
        >
          <List
            className={cn(
              "w-5 h-5 transition-colors",
              screen === "lists" ? "text-brand-highlight" : "text-text-hint",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-medium transition-colors",
              screen === "lists" ? "text-brand-highlight" : "text-text-hint",
            )}
          >
            Lists
          </span>
        </button>
      </div>
    </nav>
  );
}