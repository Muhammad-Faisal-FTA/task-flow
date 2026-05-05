// components/cdf/CdfDashboard.tsx
"use client";

import { useState } from "react";
import { BarChart2, Clock, RefreshCw } from "lucide-react";
import { CdfScoreCard } from "@/components/cdf/CdfScoreCard";
import { CdfEventList } from "@/components/cdf/CdfEventList";
import { useCdfScores } from "@/hooks/useCdfScores";
import { useCdfSettings } from "@/hooks/useCdfSettings";

// ─── Tab type ─────────────────────────────────────────────────────────────────
type Tab = "scores" | "history";

// ─── Empty / disabled states ──────────────────────────────────────────────────
function CdfDisabledState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6"
      style={{ textAlign: "center" }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-5"
        style={{
          width: "72px",
          height: "72px",
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <BarChart2
          style={{
            width: "32px",
            height: "32px",
            color: "var(--color-text-hint)",
          }}
        />
      </div>

      <p
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: "8px",
        }}
      >
        CDF Tracking is Off
      </p>

      <p
        style={{
          fontSize: "var(--text-base)",
          color: "var(--color-text-hint)",
          lineHeight: 1.6,
          maxWidth: "280px",
        }}
      >
        Enable CDF in Settings to start tracking your Consistency, Discipline,
        and Focus.
      </p>

      <div
        className="flex flex-col gap-3 mt-8 w-full"
        style={{ maxWidth: "280px" }}
      >
        {[
          {
            icon: "📅",
            label: "Consistency",
            desc: "Track recurring task completion",
          },
          {
            icon: "⏱",
            label: "Discipline",
            desc: "Complete tasks before due time",
          },
          {
            icon: "🧠",
            label: "Focus",
            desc: "Rate your concentration per task",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-card px-4 py-3"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-default)",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "20px" }}>{item.icon}</span>
            <div>
              <p
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-hint)",
                }}
              >
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoDataState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6"
      style={{ textAlign: "center" }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: "64px",
          height: "64px",
          backgroundColor: "var(--color-bg-card)",
        }}
      >
        <Clock
          style={{
            width: "28px",
            height: "28px",
            color: "var(--color-text-hint)",
          }}
        />
      </div>
      <p
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: "8px",
        }}
      >
        No data yet
      </p>
      <p
        style={{
          fontSize: "var(--text-base)",
          color: "var(--color-text-hint)",
          lineHeight: 1.6,
          maxWidth: "260px",
        }}
      >
        Complete some tasks with CDF enabled to see your scores here.
      </p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function CdfDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("scores");

  const { enabled, isLoading: settingsLoading } = useCdfSettings();
  const {
    scores,
    events,
    isLoading: scoresLoading,
    hasData,
    refresh,
  } = useCdfScores();

  const isLoading = settingsLoading || scoresLoading;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-card animate-pulse"
            style={{
              height: i === 1 ? "280px" : "120px",
              backgroundColor: "var(--color-bg-card)",
            }}
          />
        ))}
      </div>
    );
  }

  // ── CDF disabled ─────────────────────────────────────────────────────────
  if (!enabled) {
    return <CdfDisabledState />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div
        className="flex"
        style={{
          backgroundColor: "var(--color-bg-header)",
          borderBottom: "1px solid var(--color-border-default)",
          padding: "0 16px",
        }}
      >
        {(["scores", "history"] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: "var(--text-sm)",
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? "var(--color-today)"
                  : "var(--color-text-hint)",
                borderBottom: isActive
                  ? "2px solid var(--color-today)"
                  : "2px solid transparent",
                background: "none",
                border: "none",
                // borderBottom:  isActive
                //   ? "2px solid var(--color-today)"
                //   : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textTransform: "capitalize",
              }}
            >
              {tab === "scores" ? "📊 Scores" : "📋 History"}
            </button>
          );
        })}

        {/* Refresh button */}
        <button
          onClick={refresh}
          style={{
            padding: "12px 8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-hint)",
          }}
          aria-label="Refresh"
        >
          <RefreshCw style={{ width: "15px", height: "15px" }} />
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ padding: "16px 16px 100px" }}
      >
        {activeTab === "scores" ? (
          hasData && scores ? (
            <CdfScoreCard scores={scores} />
          ) : (
            <NoDataState />
          )
        ) : (
          <CdfEventList groups={events} isLoading={scoresLoading} />
        )}
      </div>
    </div>
  );
}
