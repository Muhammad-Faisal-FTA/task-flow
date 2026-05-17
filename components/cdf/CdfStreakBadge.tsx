// components/cdf/CdfStreakBadge.tsx
"use client";

interface CdfStreakBadgeProps {
  streak: number; // current streak
  longestStreak: number; // all-time best
}

export function CdfStreakBadge({ streak, longestStreak }: CdfStreakBadgeProps) {
  if (streak === 0) {
    return (
      <div
        className="flex flex-col items-center gap-1 px-4 py-3 rounded-card"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <span style={{ fontSize: "22px" }}>💤</span>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-hint)",
            textAlign: "center",
          }}
        >
          No streak yet
        </p>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-hint)",
            opacity: 0.7,
          }}
        >
          Complete a daily task to start
        </p>
      </div>
    );
  }

  // Streak intensity — color + flame size based on length
  const intensity =
    streak >= 30
      ? "legendary"
      : streak >= 14
        ? "hot"
        : streak >= 7
          ? "warm"
          : streak >= 3
            ? "building"
            : "starting";

  const INTENSITY_CONFIG = {
    legendary: {
      color: "#29B6F6",
      flame: "🔥",
      label: "Legendary",
      glow: "rgba(41,182,246,0.3)",
    },
    hot: {
      color: "#E53935",
      flame: "🔥",
      label: "On Fire!",
      glow: "rgba(229,57,53,0.25)",
    },
    warm: {
      color: "#F57C00",
      flame: "🔥",
      label: "Heating Up",
      glow: "rgba(245,124,0,0.2)",
    },
    building: {
      color: "#43A047",
      flame: "🔥",
      label: "Building",
      glow: "rgba(67,160,71,0.2)",
    },
    starting: {
      color: "#1E8BC3",
      flame: "🔥",
      label: "Started",
      glow: "rgba(30,139,195,0.2)",
    },
  };

  const cfg = INTENSITY_CONFIG[intensity];

  return (
    <div
      className="flex flex-col items-center gap-2 px-4 py-3 rounded-card"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: `1px solid ${cfg.color}40`,
        boxShadow: `0 4px 20px ${cfg.glow}`,
      }}
    >
      {/* Flame + number */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: "28px" }}>{cfg.flame}</span>
        <div>
          <p
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: cfg.color,
              lineHeight: 1,
            }}
          >
            {streak}
          </p>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-hint)",
              lineHeight: 1,
            }}
          >
            day streak
          </p>
        </div>
      </div>

      {/* Label */}
      <span
        className="px-3 py-0.5 rounded-pill"
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 700,
          color: cfg.color,
          backgroundColor: `${cfg.color}15`,
          border: `1px solid ${cfg.color}30`,
        }}
      >
        {cfg.label}
      </span>

      {/* Best streak */}
      {longestStreak > 0 && (
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-hint)",
          }}
        >
          Best:{" "}
          <strong style={{ color: "var(--color-text-secondary)" }}>
            {longestStreak} days
          </strong>
        </p>
      )}
    </div>
  );
}
