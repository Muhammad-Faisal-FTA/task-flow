// components/cdf/CdfEventList.tsx
"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock, AlertCircle, Repeat2, Brain } from "lucide-react";
import type { CdfEventGroup, CdfEventDTO } from "@/types/cdf";
import { GRADE_COLOR, getGrade } from "@/types/cdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLate(ms: number): string {
  if (ms === 0) return "On time";
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m late`;
  return `${mins}m late`;
}

function repeatLabel(repeat: CdfEventDTO["repeat"]): string {
  const MAP: Record<CdfEventDTO["repeat"], string> = {
    none: "",
    daily: "Daily",
    weekdays: "Weekdays",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };
  return MAP[repeat] ?? "";
}

// ─── Single event card ────────────────────────────────────────────────────────
function EventCard({ event }: { event: CdfEventDTO }) {
  const focusGrade =
    event.focusScore !== null ? getGrade(event.focusScore) : null;
  const focusColor = focusGrade ? GRADE_COLOR[focusGrade] : null;
  const disciplineColor = event.onTime
    ? "var(--color-success)"
    : "var(--color-overdue)";

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--color-border-default)",
        borderLeft: `3px solid ${
          event.onTime ? "var(--color-success)" : "var(--color-overdue)"
        }`,
        padding: "12px 14px",
        marginBottom: "8px",
      }}
    >
      {/* ── Top row ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        {/* Task title + repeat */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CheckCircle2
              style={{
                width: "14px",
                height: "14px",
                color: "var(--color-success)",
                flexShrink: 0,
              }}
            />
            <p
              className="truncate"
              style={{
                fontSize: "var(--text-base)",
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              {event.taskTitle}
            </p>
          </div>

          {/* Repeat badge */}
          {event.repeat !== "none" && (
            <div
              className="flex items-center gap-1 mt-1"
              style={{ marginLeft: "22px" }}
            >
              <Repeat2
                style={{
                  width: "11px",
                  height: "11px",
                  color: "var(--color-repeat)",
                }}
              />
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-repeat)",
                }}
              >
                {repeatLabel(event.repeat)}
              </span>
            </div>
          )}
        </div>

        {/* Completion time */}
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-hint)",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          {formatTime(event.completedAt)}
        </span>
      </div>

      {/* ── Metrics row ──────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 flex-wrap"
        style={{ marginTop: "10px" }}
      >
        {/* Discipline — on time / late */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-pill"
          style={{
            backgroundColor: event.onTime
              ? "rgba(67,160,71,0.1)"
              : "rgba(229,57,53,0.1)",
            border: `1px solid ${
              event.onTime ? "rgba(67,160,71,0.3)" : "rgba(229,57,53,0.3)"
            }`,
          }}
        >
          {event.onTime ? (
            <CheckCircle2
              style={{
                width: "11px",
                height: "11px",
                color: "var(--color-success)",
              }}
            />
          ) : (
            <AlertCircle
              style={{
                width: "11px",
                height: "11px",
                color: "var(--color-overdue)",
              }}
            />
          )}
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: disciplineColor,
            }}
          >
            {formatLate(event.lateByMs)}
          </span>
        </div>

        {/* Focus score */}
        {event.focusScore !== null && focusColor ? (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-pill"
            style={{
              backgroundColor: `${focusColor}12`,
              border: `1px solid ${focusColor}30`,
            }}
          >
            <Brain
              style={{
                width: "11px",
                height: "11px",
                color: focusColor,
              }}
            />
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: focusColor,
              }}
            >
              Focus {event.focusScore}
            </span>
          </div>
        ) : (
          // Focus not yet entered (shouldn't happen — but fallback)
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-pill"
            style={{
              backgroundColor: "rgba(84,110,122,0.1)",
              border: "1px solid rgba(84,110,122,0.2)",
            }}
          >
            <Brain
              style={{
                width: "11px",
                height: "11px",
                color: "var(--color-text-hint)",
              }}
            />
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-hint)",
              }}
            >
              No focus score
            </span>
          </div>
        )}

        {/* Due time — only if task had one */}
        {event.dueTime && (
          <div
            className="flex items-center gap-1"
            style={{ marginLeft: "auto" }}
          >
            <Clock
              style={{
                width: "11px",
                height: "11px",
                color: "var(--color-text-hint)",
              }}
            />
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-hint)",
              }}
            >
              Due {event.dueTime}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Group header ─────────────────────────────────────────────────────────────
function GroupHeader({ label, count }: { label: string; count: number }) {
  const LABEL_COLOR: Record<string, string> = {
    Today: "var(--color-today)",
    Yesterday: "var(--color-accent)",
    "Last 7 Days": "var(--color-primary)",
    Older: "var(--color-text-hint)",
  };

  const color = LABEL_COLOR[label] ?? "var(--color-text-hint)";

  return (
    <div
      className="flex items-center gap-2"
      style={{ marginBottom: "10px", marginTop: "4px" }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 700,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-hint)",
          marginLeft: "auto",
        }}
      >
        {count} event{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────────
function EventSummary({ events }: { events: CdfEventDTO[] }) {
  const stats = useMemo(() => {
    const total = events.length;
    const onTime = events.filter((e) => e.onTime).length;
    const withFocus = events.filter((e) => e.focusScore !== null).length;
    const avgFocus =
      withFocus > 0
        ? Math.round(
            events
              .filter((e) => e.focusScore !== null)
              .reduce((s, e) => s + (e.focusScore ?? 0), 0) / withFocus,
          )
        : null;

    return { total, onTime, withFocus, avgFocus };
  }, [events]);

  if (stats.total === 0) return null;

  return (
    <div className="flex gap-2 mb-5" style={{ flexWrap: "wrap" }}>
      {[
        {
          label: "Total",
          value: `${stats.total}`,
          color: "var(--color-accent)",
        },
        {
          label: "On Time",
          value: `${stats.onTime}/${stats.total}`,
          color: "var(--color-success)",
        },
        {
          label: "Avg Focus",
          value: stats.avgFocus !== null ? `${stats.avgFocus}` : "—",
          color: "var(--color-primary)",
        },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="flex-1 rounded-card px-3 py-2"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-default)",
            minWidth: "80px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color,
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-hint)",
              marginTop: "2px",
            }}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface CdfEventListProps {
  groups: CdfEventGroup[];
  isLoading: boolean;
}

export function CdfEventList({ groups, isLoading }: CdfEventListProps) {
  // Flatten all events for summary
  const allEvents = useMemo(() => groups.flatMap((g) => g.events), [groups]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" style={{ padding: "8px 0" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-card animate-pulse"
            style={{
              height: "80px",
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-default)",
            }}
          />
        ))}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (groups.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12"
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
          <Brain
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
          No events yet
        </p>
        <p style={{ fontSize: "var(--text-sm)", textAlign: "center" }}>
          Complete tasks with CDF enabled to see your history.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary bar across all events */}
      <EventSummary events={allEvents} />

      {/* Grouped event list */}
      {groups.map((group) => (
        <div key={group.label} style={{ marginBottom: "20px" }}>
          <GroupHeader label={group.label} count={group.events.length} />
          {group.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ))}
    </div>
  );
}
