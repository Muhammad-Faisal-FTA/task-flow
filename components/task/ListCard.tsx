// "use client";
// import { AlignJustify, Trash2 } from "lucide-react";
// import type { TaskList } from "@/types";
// import { cn } from "@/lib/cn";

// interface ListCardProps {
//   list: TaskList;
//   onDelete: (id: string) => void;
// }

// export function ListCard({ list, onDelete }: ListCardProps) {
//   return (
//     <div className={cn(
//       "flex items-center gap-3 px-4 py-3.5 rounded-card bg-layer-2 shadow-card animate-slide-up border-l-[3px]"
//     )}
//     style={{ borderLeftColor: list.color }}
//     >
//       {/* Color dot */}
//       <div
//         className="w-3 h-3 rounded-full flex-shrink-0"
//         style={{ backgroundColor: list.color }}
//       />

//       {/* Info */}
//       <div className="flex-1 min-w-0">
//         <p className="text-[15px] font-medium text-text-primary truncate">{list.name}</p>
//         <p className="text-[12px] text-text-tag mt-0.5">
//           {list.taskCount > 0 ? (
//             <>
//               Tasks: {list.taskCount}
//               {list.overdueCount > 0 && (
//                 <span className="text-status-overdue"> · {list.overdueCount} overdue</span>
//               )}
//             </>
//           ) : (
//             "No tasks"
//           )}
//         </p>
//       </div>

//       {/* Actions */}
//       <div className="flex items-center gap-1">
//         <button
//           className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-layer-1 hover:bg-layer-3/30 transition-colors"
//           aria-label="Reorder"
//         >
//           <AlignJustify className="w-4 h-4 text-text-tag" />
//         </button>
//         <button
//           onClick={() => onDelete(list.id)}
//           className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-layer-1 hover:bg-status-overdue/20 transition-colors"
//           aria-label="Delete list"
//         >
//           <Trash2 className="w-4 h-4 text-text-tag hover:text-status-overdue transition-colors" />
//         </button>
//       </div>
//     </div>
//   );
// }


// components/task/ListCard.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { LIST_COLORS } from "@/lib/data";
import type { TaskList } from "@/types";

interface ListCardProps {
  list:         TaskList;
  onDelete:     (id: string) => void;
  onUpdate:     (id: string, data: { name?: string; color?: string }) => void;
  isDefault?:   boolean;
}

export function ListCard({
  list,
  onDelete,
  onUpdate,
  isDefault = false,
}: ListCardProps) {
  const [isEditing,  setIsEditing]  = useState(false);
  const [editName,   setEditName]   = useState(list.name);
  const [editColor,  setEditColor]  = useState(list.color);
  const [showDelete, setShowDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when edit mode opens
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isEditing]);

  const handleSave = () => {
    if (!editName.trim()) return;
    const updates: { name?: string; color?: string } = {};
    if (editName.trim() !== list.name) updates.name  = editName.trim();
    if (editColor         !== list.color) updates.color = editColor;

    if (Object.keys(updates).length > 0) {
      onUpdate(list.id, updates);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(list.name);
    setEditColor(list.color);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!showDelete) {
      // First tap — show confirmation
      setShowDelete(true);
      setTimeout(() => setShowDelete(false), 3000);
    } else {
      // Second tap — confirm delete
      onDelete(list.id);
    }
  };

  return (
    <div
      className="rounded-card shadow-card overflow-hidden"
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderLeft:      `3px solid ${editColor}`,
        marginBottom:    "8px",
      }}
    >
      {/* ── Main row ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3.5">

        {/* Color dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: editColor }}
        />

        {/* Info / edit input */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter")  handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="w-full bg-transparent outline-none font-medium"
              style={{
                fontSize:    "var(--text-md)",
                color:       "var(--color-text-primary)",
                borderBottom:"1.5px solid var(--color-primary)",
                paddingBottom:"2px",
              }}
              maxLength={50}
            />
          ) : (
            <p
              className="font-medium truncate"
              style={{
                fontSize: "var(--text-md)",
                color:    "var(--color-text-primary)",
              }}
            >
              {list.name}
              {isDefault && (
                <span
                  className="ml-2 font-normal"
                  style={{
                    fontSize:        "var(--text-xs)",
                    color:           "var(--color-text-accent)",
                    backgroundColor: "rgba(30,139,195,0.1)",
                    padding:         "2px 6px",
                    borderRadius:    "var(--radius-btn)",
                  }}
                >
                  Default
                </span>
              )}
            </p>
          )}

          {/* Stats row */}
          {!isEditing && (
            <p
              className="mt-0.5"
              style={{
                fontSize: "var(--text-sm)",
                color:    "var(--color-text-hint)",
              }}
            >
              {list.taskCount > 0 ? (
                <>
                  {list.taskCount} task{list.taskCount !== 1 ? "s" : ""}
                  {list.overdueCount > 0 && (
                    <span style={{ color: "var(--color-overdue)" }}>
                      {" "}· {list.overdueCount} overdue
                    </span>
                  )}
                </>
              ) : (
                "No tasks"
              )}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              {/* Save */}
              <button
                onClick={handleSave}
                disabled={!editName.trim()}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] active:scale-90 transition-transform"
                style={{
                  backgroundColor: editName.trim()
                    ? "rgba(67,160,71,0.15)"
                    : "transparent",
                  border: "1px solid var(--color-border-default)",
                }}
                aria-label="Save"
              >
                <Check
                  className="w-4 h-4"
                  style={{ color: "var(--color-success)" }}
                />
              </button>

              {/* Cancel */}
              <button
                onClick={handleCancel}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] active:scale-90 transition-transform"
                style={{
                  backgroundColor: "transparent",
                  border:          "1px solid var(--color-border-default)",
                }}
                aria-label="Cancel"
              >
                <X
                  className="w-4 h-4"
                  style={{ color: "var(--color-text-hint)" }}
                />
              </button>
            </>
          ) : (
            <>
              {/* Edit — disabled for default list rename */}
              <button
                onClick={() => !isDefault && setIsEditing(true)}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] active:scale-90 transition-all"
                style={{
                  backgroundColor: "var(--color-bg-header)",
                  border:          "1px solid var(--color-border-default)",
                  opacity:         isDefault ? 0.4 : 1,
                  cursor:          isDefault ? "not-allowed" : "pointer",
                }}
                aria-label="Edit list"
                disabled={isDefault}
              >
                <Pencil
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--color-text-hint)" }}
                />
              </button>

              {/* Delete — disabled for default list */}
              {!isDefault && (
                <button
                  onClick={handleDelete}
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] active:scale-90 transition-all"
                  style={{
                    backgroundColor: showDelete
                      ? "rgba(229,57,53,0.15)"
                      : "var(--color-bg-header)",
                    border: `1px solid ${
                      showDelete
                        ? "var(--color-overdue)"
                        : "var(--color-border-default)"
                    }`,
                  }}
                  aria-label={showDelete ? "Confirm delete" : "Delete list"}
                >
                  <Trash2
                    className="w-3.5 h-3.5"
                    style={{
                      color: showDelete
                        ? "var(--color-overdue)"
                        : "var(--color-text-hint)",
                    }}
                  />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Color picker — only in edit mode ───────────────────────────── */}
      {isEditing && (
        <div
          className="flex items-center gap-2 px-4 pb-4"
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              color:    "var(--color-text-hint)",
              flexShrink: 0,
            }}
          >
            Color:
          </span>
          {LIST_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setEditColor(c)}
              className="transition-all duration-150 active:scale-90"
              style={{
                width:        "24px",
                height:       "24px",
                borderRadius: "50%",
                backgroundColor: c,
                border:       editColor === c
                  ? "2.5px solid white"
                  : "2px solid transparent",
                boxShadow:    editColor === c
                  ? `0 0 0 1px ${c}`
                  : "none",
                transform:    editColor === c ? "scale(1.15)" : "scale(1)",
              }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      )}

      {/* ── Delete confirmation hint ────────────────────────────────────── */}
      {showDelete && (
        <div
          className="px-4 pb-3 flex items-center gap-2"
          style={{
            fontSize: "var(--text-xs)",
            color:    "var(--color-overdue)",
          }}
        >
          <span>⚠</span>
          <span>Tap delete again to confirm. This cannot be undone.</span>
        </div>
      )}
    </div>
  );
}