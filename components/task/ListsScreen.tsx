// "use client";
// import { useState } from "react";
// import { Plus, X } from "lucide-react";
// import { HeaderBar } from "@/components/layout/HeaderBar";
// import { ListCard } from "@/components/task/ListCard";
// import { LIST_COLORS } from "@/lib/data";
// import { cn } from "@/lib/cn";
// import type { TaskList, Screen } from "@/types";

// // Flexible interface that works with both useAppState and useAuthenticatedApp
// interface ListsScreenState {
//   lists: TaskList[];
//   deleteList: (id: string) => void;
//   addList: (name: string, color: string) => void;
//   goBack: () => void;
//   navigate: (screen: Screen) => void;
// }

// interface ListsScreenProps {
//   state: ListsScreenState;
// }

// export function ListsScreen({ state }: ListsScreenProps) {
//   const { lists, deleteList, addList, goBack } = state;
//   const [showNewList, setShowNewList] = useState(false);
//   const [newName, setNewName] = useState("");
//   const [newColor, setNewColor] = useState(LIST_COLORS[0]);

//   const handleAdd = () => {
//     if (!newName.trim()) return;
//     addList(newName.trim(), newColor);
//     setNewName("");
//     setNewColor(LIST_COLORS[0]);
//     setShowNewList(false);
//   };

//   return (
//     <div className="flex flex-col h-full">
//       <HeaderBar
//         title="Task Lists"
//         showBack
//         onBack={goBack}
//         rightAction={
//           <button
//             onClick={() => setShowNewList(v => !v)}
//             className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-layer-2 active:bg-layer-3 transition-colors"
//           >
//             {showNewList
//               ? <X className="w-4 h-4 text-text-tag" />
//               : <Plus className="w-4 h-4 text-brand-highlight" />
//             }
//           </button>
//         }
//       />

//       <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-none">

//         {/* New list form */}
//         {showNewList && (
//           <div className="bg-layer-2 border border-brand-accent/30 rounded-card p-4 mb-4 animate-slide-up">
//             <p className="text-[11px] font-semibold tracking-widest uppercase text-brand-accent mb-3">
//               New List
//             </p>
//             <input
//               value={newName}
//               onChange={e => setNewName(e.target.value)}
//               onKeyDown={e => e.key === "Enter" && handleAdd()}
//               placeholder="List name…"
//               autoFocus
//               className="w-full bg-layer-1 border border-layer-3/40 rounded-input px-4 py-3 text-[14px] text-text-primary placeholder:text-text-placeholder outline-none focus:border-brand-accent transition-colors mb-3"
//             />
//             {/* Color picker */}
//             <div className="flex items-center gap-2 mb-3">
//               {LIST_COLORS.map(c => (
//                 <button
//                   key={c}
//                   onClick={() => setNewColor(c)}
//                   className={cn(
//                     "w-7 h-7 rounded-full transition-all duration-150",
//                     newColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-layer-2 scale-110" : ""
//                   )}
//                   style={{ backgroundColor: c }}
//                 />
//               ))}
//             </div>
//             <button
//               onClick={handleAdd}
//               disabled={!newName.trim()}
//               className={cn(
//                 "w-full py-2.5 rounded-input text-[14px] font-semibold transition-all",
//                 newName.trim()
//                   ? "bg-brand text-white active:scale-[0.98]"
//                   : "bg-layer-1 text-text-tag cursor-not-allowed"
//               )}
//             >
//               Create List
//             </button>
//           </div>
//         )}

//         {/* List items */}
//         <div className="space-y-2">
//           {lists.map(list => (
//             <ListCard key={list.id} list={list} onDelete={deleteList} />
//           ))}
//         </div>

//         {lists.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-20 text-text-tag">
//             <p className="text-[15px] font-medium text-text-primary">No lists yet</p>
//             <p className="text-[13px] mt-1">Tap + to create one.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }




// components/task/ListsScreen.tsx
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { ListCard }  from "@/components/task/ListCard";
import { LIST_COLORS } from "@/lib/data";
import { cn } from "@/lib/cn";
import type { TaskList, Screen } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ListsScreenState {
  lists:      TaskList[];
  deleteList: (id: string) => void;
  addList:    (name: string, color: string) => void;
  updateList: (id: string, data: { name?: string; color?: string }) => void;
  goBack:     () => void;
  navigate:   (screen: Screen) => void;
}

interface ListsScreenProps {
  state: ListsScreenState;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ListsScreen({ state }: ListsScreenProps) {
  const { lists, deleteList, addList, updateList, goBack } = state;

  const [showNewList, setShowNewList] = useState(false);
  const [newName,     setNewName]     = useState("");
  const [newColor,    setNewColor]    = useState(LIST_COLORS[0]);
  const [nameError,   setNameError]   = useState<string | null>(null);

  // ── Create list ────────────────────────────────────────────────────────────
  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Client-side duplicate check
    const isDuplicate = lists.some(
      l => l.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setNameError("A list with this name already exists.");
      return;
    }

    addList(trimmed, newColor);
    setNewName("");
    setNewColor(LIST_COLORS[0]);
    setNameError(null);
    setShowNewList(false);
  };

  const handleNameChange = (val: string) => {
    setNewName(val);
    if (nameError) setNameError(null);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalTasks   = lists.reduce((s, l) => s + l.taskCount,    0);
  const totalOverdue = lists.reduce((s, l) => s + l.overdueCount, 0);

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <HeaderBar
        title="Task Lists"
        showBack
        onBack={goBack}
        rightAction={
          <button
            onClick={() => {
              setShowNewList(v => !v);
              setNameError(null);
              setNewName("");
              setNewColor(LIST_COLORS[0]);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-[8px] active:scale-90 transition-transform"
            style={{ backgroundColor: "var(--color-bg-card)" }}
          >
            {showNewList
              ? <X    className="w-4 h-4" style={{ color: "var(--color-text-hint)" }} />
              : <Plus className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
            }
          </button>
        }
      />

      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ padding: "16px 16px 100px" }}
      >

        {/* ── Stats strip ──────────────────────────────────────────────── */}
        {lists.length > 0 && (
          <div className="flex gap-2 mb-4">
            <div
              className="flex-1 rounded-card px-3 py-2.5"
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderLeft:      "3px solid var(--color-primary)",
              }}
            >
              <p
                className="font-bold leading-none"
                style={{ fontSize: "20px", color: "var(--color-accent)" }}
              >
                {lists.length}
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-hint)", marginTop: "2px" }}>
                Lists
              </p>
            </div>
            <div
              className="flex-1 rounded-card px-3 py-2.5"
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderLeft:      "3px solid var(--color-today)",
              }}
            >
              <p
                className="font-bold leading-none"
                style={{ fontSize: "20px", color: "var(--color-today)" }}
              >
                {totalTasks}
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-hint)", marginTop: "2px" }}>
                Tasks
              </p>
            </div>
            {totalOverdue > 0 && (
              <div
                className="flex-1 rounded-card px-3 py-2.5"
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  borderLeft:      "3px solid var(--color-overdue)",
                }}
              >
                <p
                  className="font-bold leading-none"
                  style={{ fontSize: "20px", color: "var(--color-overdue)" }}
                >
                  {totalOverdue}
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-hint)", marginTop: "2px" }}>
                  Overdue
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── New list form ─────────────────────────────────────────────── */}
        {showNewList && (
          <div
            className="rounded-card p-4 mb-4"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border:          "1px solid var(--color-primary)",
              animation:       "slideUp 0.25s ease both",
            }}
          >
            <p
              className="font-semibold tracking-widest uppercase mb-3"
              style={{
                fontSize: "var(--text-xs)",
                color:    "var(--color-text-accent)",
              }}
            >
              New List
            </p>

            {/* Name input */}
            <input
              value={newName}
              onChange={e => handleNameChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="List name…"
              autoFocus
              maxLength={50}
              className="auth-input w-full mb-1"
              style={nameError ? { borderColor: "var(--color-overdue)" } : {}}
            />

            {/* Name error */}
            {nameError && (
              <p
                className="mb-2"
                style={{
                  fontSize: "var(--text-xs)",
                  color:    "var(--color-overdue)",
                }}
              >
                ⚠ {nameError}
              </p>
            )}

            {/* Color picker */}
            <div className="flex items-center gap-2 mb-4 mt-3">
              <span
                style={{
                  fontSize:   "var(--text-xs)",
                  color:      "var(--color-text-hint)",
                  flexShrink: 0,
                }}
              >
                Color:
              </span>
              {LIST_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className="transition-all duration-150 active:scale-90"
                  style={{
                    width:           "26px",
                    height:          "26px",
                    borderRadius:    "50%",
                    backgroundColor: c,
                    border:          newColor === c
                      ? "2.5px solid white"
                      : "2px solid transparent",
                    boxShadow:       newColor === c
                      ? `0 0 0 1.5px ${c}`
                      : "none",
                    transform:       newColor === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>

            {/* Preview */}
            {newName.trim() && (
              <div
                className="flex items-center gap-2 rounded-card px-3 py-2 mb-3"
                style={{
                  backgroundColor: "var(--color-bg-header)",
                  borderLeft:      `3px solid ${newColor}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: newColor }}
                />
                <span style={{
                  fontSize:   "var(--text-sm)",
                  color:      "var(--color-text-primary)",
                  fontWeight: 500,
                }}>
                  {newName.trim()}
                </span>
              </div>
            )}

            {/* Create button */}
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="btn-primary"
              style={!newName.trim() ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              Create List
            </button>
          </div>
        )}

        {/* ── List cards ────────────────────────────────────────────────── */}
        <div>
          {lists.map(list => (
            <ListCard
              key={list.id}
              list={list}
              onDelete={deleteList}
              onUpdate={updateList}
              isDefault={(list as any).isDefault ?? false}
            />
          ))}
        </div>

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {lists.length === 0 && !showNewList && (
          <div
            className="flex flex-col items-center justify-center py-20"
            style={{ color: "var(--color-text-hint)" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--color-bg-card)" }}
            >
              <span style={{ fontSize: "28px" }}>📋</span>
            </div>
            <p
              className="font-medium"
              style={{
                fontSize: "var(--text-md)",
                color:    "var(--color-text-primary)",
              }}
            >
              No lists yet
            </p>
            <p
              className="mt-1"
              style={{ fontSize: "var(--text-sm)" }}
            >
              Tap + to create your first list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}