// components/task/SearchResults.tsx
"use client";

import { Search } from "lucide-react";
import type { TaskDTO, TaskListDTO } from "@/types/task";

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  overdue: {
    label: "Overdue",
    color: "var(--color-overdue)",
    bg: "rgba(229,57,53,0.12)",
  },
  today: {
    label: "Today",
    color: "var(--color-today)",
    bg: "rgba(41,182,246,0.12)",
  },
  tomorrow: {
    label: "Tomorrow",
    color: "var(--color-accent)",
    bg: "rgba(41,182,246,0.08)",
  },
  next_week: {
    label: "Next Week",
    color: "var(--color-primary)",
    bg: "rgba(21,101,168,0.15)",
  },
  future: {
    label: "Future",
    color: "var(--color-text-secondary)",
    bg: "rgba(176,196,222,0.1)",
  },
  nodate: {
    label: "No Date",
    color: "var(--color-text-hint)",
    bg: "rgba(107,140,174,0.1)",
  },
};

// ─── Highlight matching text ──────────────────────────────────────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              backgroundColor: "rgba(41,182,246,0.25)",
              color: "var(--color-today)",
              borderRadius: "2px",
              padding: "0 1px",
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

// ─── Single result card ───────────────────────────────────────────────────────
function ResultCard({
  task,
  list,
  query,
  onClick,
}: {
  task: TaskDTO;
  list?: TaskListDTO;
  query: string;
  onClick: (task: TaskDTO) => void;
}) {
  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.nodate;

  return (
    <div
      onClick={() => onClick(task)}
      className="flex items-start gap-3 rounded-card cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderLeft: `3px solid ${statusCfg.color}`,
        padding: "12px 14px",
        marginBottom: "8px",
      }}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title with highlight */}
        <p
          style={{
            fontSize: "var(--text-md)",
            color: "var(--color-text-primary)",
            fontWeight: 500,
            lineHeight: 1.3,
          }}
        >
          <HighlightMatch text={task.title} query={query} />
        </p>

        {/* Meta row */}
        <div
          className="flex items-center gap-2 flex-wrap"
          style={{ marginTop: "6px" }}
        >
          {/* Status badge */}
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: statusCfg.color,
              backgroundColor: statusCfg.bg,
              padding: "2px 8px",
              borderRadius: "var(--radius-btn)",
            }}
          >
            {statusCfg.label}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-hint)",
              }}
            >
              {new Date(task.dueDate + "T00:00:00").toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                },
              )}
              {task.dueTime && ` · ${formatTime(task.dueTime)}`}
            </span>
          )}

          {/* List badge */}
          {list && (
            <span
              className="flex items-center gap-1"
              style={{
                fontSize: "var(--text-xs)",
                color: list.color,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: list.color,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {list.name}
            </span>
          )}

          {/* Repeat */}
          {task.repeat !== "none" && (
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-repeat)",
              }}
            >
              ↻ {task.repeat}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface SearchResultsProps {
  query: string;
  results: TaskDTO[];
  lists: TaskListDTO[];
  isSearching: boolean;
  hasSearched: boolean;
  onTaskClick: (task: TaskDTO) => void;
}

export function SearchResults({
  query,
  results,
  lists,
  isSearching,
  hasSearched,
  onTaskClick,
}: SearchResultsProps) {
  // ── Empty query ────────────────────────────────────────────────────────────
  if (!query.trim()) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16"
        style={{ color: "var(--color-text-hint)" }}
      >
        <Search
          style={{
            width: "40px",
            height: "40px",
            marginBottom: "12px",
            color: "var(--color-border-default)",
          }}
        />
        <p style={{ fontSize: "var(--text-sm)" }}>Type to search your tasks</p>
      </div>
    );
  }

  // ── Searching ──────────────────────────────────────────────────────────────
  if (isSearching && !hasSearched) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16"
        style={{ color: "var(--color-text-hint)" }}
      >
        <p style={{ fontSize: "var(--text-sm)" }}>Searching…</p>
      </div>
    );
  }

  // ── No results ─────────────────────────────────────────────────────────────
  if (hasSearched && results.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16"
        style={{ color: "var(--color-text-hint)" }}
      >
        <div
          className="flex items-center justify-center rounded-full mb-4"
          style={{
            width: "56px",
            height: "56px",
            backgroundColor: "var(--color-bg-card)",
          }}
        >
          <Search
            style={{
              width: "24px",
              height: "24px",
              color: "var(--color-text-hint)",
            }}
          />
        </div>
        <p
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            marginBottom: "4px",
          }}
        >
          No results found
        </p>
        <p style={{ fontSize: "var(--text-sm)" }}>
          No tasks match &quot;{query}&quot;
        </p>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Result count */}
      <p
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-hint)",
          marginBottom: "12px",
          paddingLeft: "2px",
        }}
      >
        {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
        <strong style={{ color: "var(--color-text-secondary)" }}>
          &quot;{query}&quot;
        </strong>
      </p>

      {/* Result cards */}
      {results.map((task) => (
        <ResultCard
          key={task.id}
          task={task}
          list={
            lists.find((l) => l.id === task.listId) as TaskListDTO | undefined
          }
          query={query}
          onClick={onTaskClick}
        />
      ))}
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
