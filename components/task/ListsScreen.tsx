"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { ListCard } from "@/components/task/ListCard";
import { LIST_COLORS } from "@/lib/data";
import { cn } from "@/lib/cn";
import type { TaskList, Screen } from "@/types";

// Flexible interface that works with both useAppState and useAuthenticatedApp
interface ListsScreenState {
  lists: TaskList[];
  deleteList: (id: string) => void;
  addList: (name: string, color: string) => void;
  goBack: () => void;
  navigate: (screen: Screen) => void;
}

interface ListsScreenProps {
  state: ListsScreenState;
}

export function ListsScreen({ state }: ListsScreenProps) {
  const { lists, deleteList, addList, goBack } = state;
  const [showNewList, setShowNewList] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LIST_COLORS[0]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addList(newName.trim(), newColor);
    setNewName("");
    setNewColor(LIST_COLORS[0]);
    setShowNewList(false);
  };

  return (
    <div className="flex flex-col h-full">
      <HeaderBar
        title="Task Lists"
        showBack
        onBack={goBack}
        rightAction={
          <button
            onClick={() => setShowNewList(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-layer-2 active:bg-layer-3 transition-colors"
          >
            {showNewList
              ? <X className="w-4 h-4 text-text-tag" />
              : <Plus className="w-4 h-4 text-brand-highlight" />
            }
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-none">

        {/* New list form */}
        {showNewList && (
          <div className="bg-layer-2 border border-brand-accent/30 rounded-card p-4 mb-4 animate-slide-up">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-brand-accent mb-3">
              New List
            </p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="List name…"
              autoFocus
              className="w-full bg-layer-1 border border-layer-3/40 rounded-input px-4 py-3 text-[14px] text-text-primary placeholder:text-text-placeholder outline-none focus:border-brand-accent transition-colors mb-3"
            />
            {/* Color picker */}
            <div className="flex items-center gap-2 mb-3">
              {LIST_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all duration-150",
                    newColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-layer-2 scale-110" : ""
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className={cn(
                "w-full py-2.5 rounded-input text-[14px] font-semibold transition-all",
                newName.trim()
                  ? "bg-brand text-white active:scale-[0.98]"
                  : "bg-layer-1 text-text-tag cursor-not-allowed"
              )}
            >
              Create List
            </button>
          </div>
        )}

        {/* List items */}
        <div className="space-y-2">
          {lists.map(list => (
            <ListCard key={list.id} list={list} onDelete={deleteList} />
          ))}
        </div>

        {lists.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-text-tag">
            <p className="text-[15px] font-medium text-text-primary">No lists yet</p>
            <p className="text-[13px] mt-1">Tap + to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
