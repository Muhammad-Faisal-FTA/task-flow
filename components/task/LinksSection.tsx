// Add this component inside DetailScreen.tsx — above the main component

import { ExternalLink, Plus, Pencil, Trash2 as TrashIcon, Check, X as XIcon, Link } from "lucide-react";
import type { TaskLink } from "@/types/task";
import { v4 as uuidv4 } from "uuid";   // npm install uuid + @types/uuid
import { useState } from "react";

// ─── Links section ────────────────────────────────────────────────────────────
interface LinksSectionProps {
  links:    TaskLink[];
  onChange: (links: TaskLink[]) => void;
}

export function LinksSection({ links, onChange }: LinksSectionProps) {
  const [isAdding,   setIsAdding]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [nameInput,  setNameInput]  = useState("");
  const [urlInput,   setUrlInput]   = useState("");
  const [urlError,   setUrlError]   = useState<string | null>(null);

  // ── Validate URL ───────────────────────────────────────────────────────────
  function validateUrl(url: string): boolean {
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch { return false; }
  }

  function normaliseUrl(url: string): string {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  }

  // ── Add link ───────────────────────────────────────────────────────────────
  const handleAdd = () => {
    if (!nameInput.trim()) return;
    const normUrl = normaliseUrl(urlInput.trim());
    if (!validateUrl(normUrl)) {
      setUrlError("Enter a valid URL");
      return;
    }
    onChange([
      ...links,
      { id: uuidv4(), name: nameInput.trim(), url: normUrl },
    ]);
    setNameInput("");
    setUrlInput("");
    setUrlError(null);
    setIsAdding(false);
  };

  // ── Save edit ──────────────────────────────────────────────────────────────
  const handleSaveEdit = (id: string) => {
    if (!nameInput.trim()) return;
    const normUrl = normaliseUrl(urlInput.trim());
    if (!validateUrl(normUrl)) {
      setUrlError("Enter a valid URL");
      return;
    }
    onChange(links.map(l =>
      l.id === id
        ? { ...l, name: nameInput.trim(), url: normUrl }
        : l
    ));
    setEditingId(null);
    setNameInput("");
    setUrlInput("");
    setUrlError(null);
  };

  // ── Start editing ──────────────────────────────────────────────────────────
  const startEdit = (link: TaskLink) => {
    setEditingId(link.id);
    setNameInput(link.name);
    setUrlInput(link.url);
    setUrlError(null);
    setIsAdding(false);
  };

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNameInput("");
    setUrlInput("");
    setUrlError(null);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    onChange(links.filter(l => l.id !== id));
  };

  const labelCls = "block font-semibold tracking-widest uppercase mb-2";

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <label
          className={labelCls}
          style={{ fontSize: "var(--text-xs)", color: "var(--color-text-accent)" }}
        >
          Links
        </label>
        {!isAdding && !editingId && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); }}
            className="flex items-center gap-1 active:scale-90 transition-transform"
            style={{
              fontSize:        "var(--text-xs)",
              fontWeight:      600,
              color:           "var(--color-primary)",
              backgroundColor: "rgba(30,139,195,0.1)",
              border:          "1px solid rgba(30,139,195,0.2)",
              borderRadius:    "var(--radius-btn)",
              padding:         "4px 10px",
              cursor:          "pointer",
            }}
          >
            <Plus style={{ width: "11px", height: "11px" }} />
            Add Link
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {(isAdding || editingId) && (
        <div
          className="rounded-card p-3 mb-3"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border:          "1px solid var(--color-primary)",
          }}
        >
          {/* Name input */}
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="Link name (e.g. Design Doc)"
            maxLength={100}
            className="auth-input w-full mb-2"
            style={{ fontSize: "var(--text-sm)" }}
            autoFocus
          />

          {/* URL input */}
          <input
            type="text"
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setUrlError(null); }}
            placeholder="URL (e.g. https://notion.so/...)"
            maxLength={2048}
            className="auth-input w-full mb-1"
            style={{
              fontSize:    "var(--text-sm)",
              borderColor: urlError ? "var(--color-overdue)" : undefined,
            }}
            onKeyDown={e => {
              if (e.key === "Enter") editingId ? handleSaveEdit(editingId) : handleAdd();
              if (e.key === "Escape") cancel();
            }}
          />

          {/* URL error */}
          {urlError && (
            <p style={{
              fontSize:  "var(--text-xs)",
              color:     "var(--color-overdue)",
              marginBottom: "8px",
            }}>
              ⚠ {urlError}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => editingId ? handleSaveEdit(editingId) : handleAdd()}
              disabled={!nameInput.trim() || !urlInput.trim()}
              className="flex items-center gap-1.5 active:scale-90 transition-transform"
              style={{
                flex:            1,
                justifyContent:  "center",
                padding:         "7px",
                borderRadius:    "var(--radius-input)",
                fontSize:        "var(--text-xs)",
                fontWeight:      700,
                color:           "#ffffff",
                backgroundColor: nameInput.trim() && urlInput.trim()
                  ? "var(--color-primary)"
                  : "var(--color-bg-header)",
                border:          "none",
                cursor:          nameInput.trim() && urlInput.trim()
                  ? "pointer"
                  : "not-allowed",
                opacity:         nameInput.trim() && urlInput.trim() ? 1 : 0.5,
              }}
            >
              <Check style={{ width: "13px", height: "13px" }} />
              {editingId ? "Save" : "Add"}
            </button>

            <button
              onClick={cancel}
              className="flex items-center gap-1.5 active:scale-90 transition-transform"
              style={{
                padding:         "7px 14px",
                borderRadius:    "var(--radius-input)",
                fontSize:        "var(--text-xs)",
                fontWeight:      600,
                color:           "var(--color-text-hint)",
                backgroundColor: "var(--color-bg-header)",
                border:          "1px solid var(--color-border-default)",
                cursor:          "pointer",
              }}
            >
              <XIcon style={{ width: "13px", height: "13px" }} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Link list */}
      {links.length === 0 && !isAdding && (
        <div
          className="flex items-center gap-2 px-3 py-3 rounded-card"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border:          "1px solid var(--color-border-default)",
          }}
        >
          <Link style={{ width: "14px", height: "14px", color: "var(--color-text-hint)" }} />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-hint)" }}>
            No links yet — tap Add Link
          </span>
        </div>
      )}

      {links.map(link => (
        <div
          key={link.id}
          className="flex items-center gap-2 px-3 py-2.5 rounded-card mb-2"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border:          "1px solid var(--color-border-default)",
          }}
        >
          {/* Link icon */}
          <span style={{ fontSize: "13px", flexShrink: 0 }}>🔗</span>

          {/* Link name — clickable */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 flex items-center gap-1.5 group"
            style={{ textDecoration: "none" }}
            onClick={e => e.stopPropagation()}
          >
            <span
              className="truncate"
              style={{
                fontSize:   "var(--text-sm)",
                fontWeight: 500,
                color:      "var(--color-today)",
                textDecoration: "underline",
                textDecorationColor: "rgba(41,182,246,0.4)",
              }}
            >
              {link.name}
            </span>
            <ExternalLink
              style={{
                width:      "11px",
                height:     "11px",
                color:      "var(--color-text-hint)",
                flexShrink: 0,
              }}
            />
          </a>

          {/* Edit button */}
          <button
            onClick={() => startEdit(link)}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] active:scale-90 transition-transform flex-shrink-0"
            style={{
              backgroundColor: "var(--color-bg-header)",
              border:          "1px solid var(--color-border-default)",
              cursor:          "pointer",
            }}
            aria-label="Edit link"
          >
            <Pencil style={{ width: "12px", height: "12px", color: "var(--color-text-hint)" }} />
          </button>

          {/* Delete button */}
          <button
            onClick={() => handleDelete(link.id)}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] active:scale-90 transition-transform flex-shrink-0"
            style={{
              backgroundColor: "rgba(229,57,53,0.08)",
              border:          "1px solid rgba(229,57,53,0.2)",
              cursor:          "pointer",
            }}
            aria-label="Delete link"
          >
            <TrashIcon style={{ width: "12px", height: "12px", color: "var(--color-overdue)" }} />
          </button>
        </div>
      ))}
    </div>
  );
}