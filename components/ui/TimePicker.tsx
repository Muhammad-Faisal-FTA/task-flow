// components/ui/TimePicker.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TimePickerProps {
  value: string | null; // "HH:MM"
  onChange: (time: string | null) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseTime(val: string | null): { hour: number; minute: number } {
  if (!val) return { hour: 8, minute: 0 };
  const [h, m] = val.split(":").map(Number);
  return {
    hour: isNaN(h) ? 8 : h,
    minute: isNaN(m) ? 0 : m,
  };
}

function formatTo12(hour: number): { display: string; period: "AM" | "PM" } {
  const period = hour >= 12 ? "PM" : "AM";
  const display = (hour % 12 || 12).toString();
  return { display, period };
}

// ─── Scroll column ────────────────────────────────────────────────────────────
interface ScrollColumnProps {
  items: string[];
  selected: number;
  onSelect: (index: number) => void;
  itemHeight?: number;
}

function ScrollColumn({
  items,
  selected,
  onSelect,
  itemHeight = 40,
}: ScrollColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScroll = useRef(0);

  // Scroll to selected on mount + change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      top: selected * itemHeight,
      behavior: "smooth",
    });
  }, [selected, itemHeight]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (clamped !== selected) onSelect(clamped);
  }, [itemHeight, items.length, selected, onSelect]);

  return (
    <div style={{ position: "relative", width: "72px" }}>
      {/* Top fade */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40px",
          background: `linear-gradient(to bottom, var(--color-bg-card), transparent)`,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Selected highlight */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "4px",
          right: "4px",
          height: `${itemHeight}px`,
          transform: "translateY(-50%)",
          backgroundColor: "var(--color-bg-active)",
          borderRadius: "var(--radius-input)",
          border: "1px solid var(--color-primary)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Scrollable list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: `${itemHeight * 5}px`,
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          position: "relative",
          zIndex: 0,
        }}
      >
        {/* Top padding — 2 empty items */}
        <div style={{ height: `${itemHeight * 2}px` }} />

        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => onSelect(i)}
            style={{
              height: `${itemHeight}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scrollSnapAlign: "center",
              fontSize: "var(--text-xl)",
              fontWeight: i === selected ? 700 : 400,
              color:
                i === selected
                  ? "var(--color-text-primary)"
                  : "var(--color-text-hint)",
              cursor: "pointer",
              transition: "color 0.15s, font-weight 0.15s",
              userSelect: "none",
            }}
          >
            {item}
          </div>
        ))}

        {/* Bottom padding */}
        <div style={{ height: `${itemHeight * 2}px` }} />
      </div>

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40px",
          background: `linear-gradient(to top, var(--color-bg-card), transparent)`,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── TimePicker ───────────────────────────────────────────────────────────────
export function TimePicker({ value, onChange }: TimePickerProps) {
  const { hour: initHour, minute: initMinute } = parseTime(value);

  const [hour, setHour] = useState(initHour);
  const [minute, setMinute] = useState(initMinute);

  // Sync to parent on change
  const updateTime = useCallback(
    (h: number, m: number) => {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      onChange(`${hh}:${mm}`);
    },
    [onChange],
  );

  const handleHourChange = useCallback(
    (index: number) => {
      setHour(index);
      updateTime(index, minute);
    },
    [minute, updateTime],
  );

  const handleMinuteChange = useCallback(
    (index: number) => {
      const m = index * 5;
      setMinute(m);
      updateTime(hour, m);
    },
    [hour, updateTime],
  );

  // Generate items
  const hours = Array.from({ length: 24 }, (_, i) => {
    const { display, period } = formatTo12(i);
    return `${display} ${period}`;
  });

  const minutes = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, "0"),
  );

  const minuteIndex = Math.round(minute / 5);

  const { display: hourDisplay, period } = formatTo12(hour);

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-card)",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--color-text-accent)",
          }}
        >
          Set Time
        </span>

        {/* Selected time preview */}
        <span
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 700,
            color: "var(--color-today)",
            backgroundColor: "rgba(41,182,246,0.1)",
            padding: "4px 10px",
            borderRadius: "var(--radius-btn)",
          }}
        >
          {hourDisplay}:{minute.toString().padStart(2, "0")} {period}
        </span>

        {/* Clear */}
        <button
          onClick={() => onChange(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            borderRadius: "var(--radius-input)",
            fontSize: "var(--text-xs)",
            color: "var(--color-overdue)",
            border: "1px solid var(--color-border-error)",
            backgroundColor: "transparent",
            cursor: "pointer",
          }}
        >
          <X style={{ width: "11px", height: "11px" }} />
          Clear
        </button>
      </div>

      {/* Scroll columns */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {/* Hour column */}
        <ScrollColumn
          items={hours}
          selected={hour}
          onSelect={handleHourChange}
        />

        {/* Separator */}
        <span
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "4px",
          }}
        >
          :
        </span>

        {/* Minute column */}
        <ScrollColumn
          items={minutes}
          selected={minuteIndex}
          onSelect={handleMinuteChange}
        />
      </div>

      {/* Quick time options */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {[
          { label: "8:00 AM", h: 8, m: 0 },
          { label: "12:00 PM", h: 12, m: 0 },
          { label: "6:00 PM", h: 18, m: 0 },
          { label: "9:00 PM", h: 21, m: 0 },
        ].map((opt) => {
          const isActive = hour === opt.h && minute === opt.m;
          return (
            <button
              key={opt.label}
              onClick={() => {
                setHour(opt.h);
                setMinute(opt.m);
                updateTime(opt.h, opt.m);
              }}
              style={{
                flex: 1,
                padding: "6px 4px",
                borderRadius: "var(--radius-input)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                border: `1.5px solid ${
                  isActive
                    ? "var(--color-primary)"
                    : "var(--color-border-default)"
                }`,
                backgroundColor: isActive
                  ? "var(--color-primary)"
                  : "transparent",
                color: isActive ? "#ffffff" : "var(--color-text-secondary)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
