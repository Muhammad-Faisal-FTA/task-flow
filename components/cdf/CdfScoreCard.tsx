// // components/cdf/CdfScoreCard.tsx
// "use client";

// import { CircularGauge } from "@/components/cdf/CircularGauge";
// import { CdfStreakBadge } from "@/components/cdf/CdfStreakBadge";
// import { GRADE_COLOR, type CdfScoreDTO } from "@/types/cdf";

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface CdfScoreCardProps {
//   scores: CdfScoreDTO;
// }

// // ─── Stat row item ────────────────────────────────────────────────────────────
// function StatRow({
//   label,
//   value,
//   color,
// }: {
//   label: string;
//   value: string;
//   color?: string;
// }) {
//   return (
//     <div
//       className="flex items-center justify-between"
//       style={{ padding: "6px 0" }}
//     >
//       <span
//         style={{
//           fontSize: "var(--text-sm)",
//           color: "var(--color-text-hint)",
//         }}
//       >
//         {label}
//       </span>
//       <span
//         style={{
//           fontSize: "var(--text-sm)",
//           fontWeight: 600,
//           color: color ?? "var(--color-text-primary)",
//         }}
//       >
//         {value}
//       </span>
//     </div>
//   );
// }

// // ─── Section divider ──────────────────────────────────────────────────────────
// function Divider() {
//   return (
//     <div
//       style={{
//         height: "1px",
//         backgroundColor: "var(--color-border-default)",
//         margin: "8px 0",
//         opacity: 0.5,
//       }}
//     />
//   );
// }

// // ─── Overall score pill ───────────────────────────────────────────────────────
// function OverallScore({ score }: { score: number }) {
//   const grade =
//     score >= 80 ? "S/A" : score >= 60 ? "B" : score >= 40 ? "C" : "D/F";
//   const color =
//     score >= 80
//       ? "var(--color-today)"
//       : score >= 60
//         ? "var(--color-primary)"
//         : score >= 40
//           ? "var(--color-warning)"
//           : "var(--color-overdue)";

//   return (
//     <div
//       className="flex flex-col items-center gap-1 py-4"
//       style={{
//         borderBottom: "1px solid var(--color-border-default)",
//         marginBottom: "20px",
//       }}
//     >
//       <p
//         style={{
//           fontSize: "var(--text-xs)",
//           fontWeight: 700,
//           letterSpacing: "1.5px",
//           textTransform: "uppercase",
//           color: "var(--color-text-hint)",
//           marginBottom: "8px",
//         }}
//       >
//         Overall CDF Score
//       </p>

//       <div
//         className="flex items-center justify-center"
//         style={{
//           width: "80px",
//           height: "80px",
//           borderRadius: "50%",
//           border: `3px solid ${color}`,
//           backgroundColor: `${color}15`,
//           boxShadow: `0 0 30px ${color}30`,
//         }}
//       >
//         <span
//           style={{
//             fontSize: "28px",
//             fontWeight: 800,
//             color,
//           }}
//         >
//           {score}
//         </span>
//       </div>

//       <p
//         style={{
//           fontSize: "var(--text-xs)",
//           color: "var(--color-text-hint)",
//           marginTop: "4px",
//         }}
//       >
//         C×40% + D×35% + F×25%
//       </p>
//     </div>
//   );
// }

// // ─── Main component ───────────────────────────────────────────────────────────
// export function CdfScoreCard({ scores }: CdfScoreCardProps) {
//   return (
//     <div className="flex flex-col gap-5 ">
//       {/* ── Overall score ──────────────────────────────────────────── */}
//       <div
//         className="rounded-card"
//         style={{
//           backgroundColor: "var(--color-bg-card)",
//           border: "1px solid var(--color-border-default)",
//           padding: "20px",
//         }}
//       >
//         <OverallScore score={scores.overallScore} />

//         {/* ── 3 Gauges — responsive grid ───────────────────────────────── */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(3, 1fr)",
//             gap: "8px",
//             width: "100%",
//             padding: "0 4px",
//           }}
//         >
//           <CircularGauge
//             score={scores.consistencyScore}
//             grade={scores.consistencyGrade}
//             label="C"
//             streak={scores.consistencyStreak}
//             showStreak={true}
//           />
//           <CircularGauge
//             score={scores.disciplineScore}
//             grade={scores.disciplineGrade}
//             label="D"
//           />
//           <CircularGauge
//             score={scores.focusScore}
//             grade={scores.focusGrade}
//             label="F"
//           />
//         </div>

//         {/* Full labels below gauges */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(3, 1fr)",
//             gap: "4px",
//             marginTop: "8px",
//             paddingBottom: "4px",
//           }}
//         >
//           {[
//             {
//               label: "Consistency",
//               color: GRADE_COLOR[scores.consistencyGrade],
//             },
//             { label: "Discipline", color: GRADE_COLOR[scores.disciplineGrade] },
//             { label: "Focus", color: GRADE_COLOR[scores.focusGrade] },
//           ].map(({ label, color }) => (
//             <p
//               key={label}
//               style={{
//                 textAlign: "center",
//                 fontSize: "var(--text-xs)",
//                 fontWeight: 600,
//                 color,
//               }}
//             >
//               {label}
//             </p>
//           ))}
//         </div>
//         {/* ── Consistency details ───────────────────────────────────── */}
//         <div
//           className="rounded-card"
//           style={{
//             backgroundColor: "var(--color-bg-card)",
//             border: "1px solid var(--color-border-default)",
//             padding: "16px",
//           }}
//         >
//           <p
//             style={{
//               fontSize: "var(--text-xs)",
//               fontWeight: 700,
//               letterSpacing: "1.5px",
//               textTransform: "uppercase",
//               color: "var(--color-text-accent)",
//               marginBottom: "12px",
//             }}
//           >
//             Consistency
//           </p>

//           <div className="flex gap-3 mb-3">
//             {/* Streak badge */}
//             <div className="flex-1">
//               <CdfStreakBadge
//                 streak={scores.consistencyStreak}
//                 longestStreak={scores.longestStreak}
//               />
//             </div>

//             {/* Stats */}
//             <div className="flex-1">
//               <StatRow
//                 label="Completed"
//                 value={`${scores.totalCompleted}`}
//                 color="var(--color-today)"
//               />
//               <Divider />
//               <StatRow label="Expected" value={`${scores.totalExpected}`} />
//               <Divider />
//               <StatRow
//                 label="Rate"
//                 value={
//                   scores.totalExpected > 0
//                     ? `${Math.round((scores.totalCompleted / scores.totalExpected) * 100)}%`
//                     : "N/A"
//                 }
//                 color="var(--color-accent)"
//               />
//             </div>
//           </div>

//           {/* Progress bar */}
//           <div>
//             <div
//               className="flex justify-between mb-1"
//               style={{
//                 fontSize: "var(--text-xs)",
//                 color: "var(--color-text-hint)",
//               }}
//             >
//               <span>30-day completion rate</span>
//               <span style={{ color: "var(--color-text-secondary)" }}>
//                 {scores.totalCompleted}/{scores.totalExpected}
//               </span>
//             </div>
//             <div
//               style={{
//                 height: "6px",
//                 borderRadius: "3px",
//                 backgroundColor: "var(--color-bg-header)",
//                 overflow: "hidden",
//               }}
//             >
//               <div
//                 style={{
//                   height: "100%",
//                   borderRadius: "3px",
//                   backgroundColor: "var(--color-today)",
//                   width: `${Math.min(scores.consistencyScore, 100)}%`,
//                   transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
//                 }}
//               />
//             </div>
//           </div>
//         </div>

//         {/* ── Discipline details ────────────────────────────────────── */}
//         <div
//           className="rounded-card"
//           style={{
//             backgroundColor: "var(--color-bg-card)",
//             border: "1px solid var(--color-border-default)",
//             padding: "16px",
//           }}
//         >
//           <p
//             style={{
//               fontSize: "var(--text-xs)",
//               fontWeight: 700,
//               letterSpacing: "1.5px",
//               textTransform: "uppercase",
//               color: "var(--color-text-accent)",
//               marginBottom: "12px",
//             }}
//           >
//             Discipline
//           </p>

//           <StatRow
//             label="On-time completions"
//             value={`${scores.onTimeCount}`}
//             color="var(--color-success)"
//           />
//           <Divider />
//           <StatRow
//             label="Total timed tasks"
//             value={`${scores.totalTimedTasks}`}
//           />
//           <Divider />
//           <StatRow
//             label="On-time rate"
//             value={
//               scores.totalTimedTasks > 0
//                 ? `${Math.round((scores.onTimeCount / scores.totalTimedTasks) * 100)}%`
//                 : "No timed tasks"
//             }
//             color="var(--color-accent)"
//           />

//           {/* Progress bar */}
//           <div style={{ marginTop: "12px" }}>
//             <div
//               style={{
//                 height: "6px",
//                 borderRadius: "3px",
//                 backgroundColor: "var(--color-bg-header)",
//                 overflow: "hidden",
//               }}
//             >
//               <div
//                 style={{
//                   height: "100%",
//                   borderRadius: "3px",
//                   backgroundColor: "var(--color-success)",
//                   width: `${Math.min(scores.disciplineScore, 100)}%`,
//                   transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
//                 }}
//               />
//             </div>
//           </div>

//           {scores.totalTimedTasks === 0 && (
//             <p
//               style={{
//                 fontSize: "var(--text-xs)",
//                 color: "var(--color-text-hint)",
//                 marginTop: "8px",
//                 fontStyle: "italic",
//               }}
//             >
//               Set a due time on tasks to track discipline.
//             </p>
//           )}
//         </div>

//         {/* ── Focus details ─────────────────────────────────────────── */}
//         <div
//           className="rounded-card"
//           style={{
//             backgroundColor: "var(--color-bg-card)",
//             border: "1px solid var(--color-border-default)",
//             padding: "16px",
//           }}
//         >
//           <p
//             style={{
//               fontSize: "var(--text-xs)",
//               fontWeight: 700,
//               letterSpacing: "1.5px",
//               textTransform: "uppercase",
//               color: "var(--color-text-accent)",
//               marginBottom: "12px",
//             }}
//           >
//             Focus
//           </p>

//           <StatRow
//             label="Average focus score"
//             value={`${Math.round(scores.focusScore)}/100`}
//             color="var(--color-accent)"
//           />
//           <Divider />
//           <StatRow label="Sessions logged" value={`${scores.focusEntries}`} />

//           {/* Focus bar */}
//           <div style={{ marginTop: "12px" }}>
//             <div
//               style={{
//                 height: "6px",
//                 borderRadius: "3px",
//                 backgroundColor: "var(--color-bg-header)",
//                 overflow: "hidden",
//               }}
//             >
//               <div
//                 style={{
//                   height: "100%",
//                   borderRadius: "3px",
//                   background: `linear-gradient(to right,
//                   ${
//                     scores.focusScore < 35
//                       ? "var(--color-overdue)"
//                       : scores.focusScore < 65
//                         ? "var(--color-warning)"
//                         : scores.focusScore < 80
//                           ? "var(--color-primary)"
//                           : "var(--color-today)"
//                   })`,
//                   width: `${Math.min(scores.focusScore, 100)}%`,
//                   transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
//                 }}
//               />
//             </div>
//           </div>

//           {scores.focusEntries === 0 && (
//             <p
//               style={{
//                 fontSize: "var(--text-xs)",
//                 color: "var(--color-text-hint)",
//                 marginTop: "8px",
//                 fontStyle: "italic",
//               }}
//             >
//               Complete tasks with CDF on to log focus scores.
//             </p>
//           )}
//         </div>

//         {/* ── Window info ───────────────────────────────────────────── */}
//         <p
//           className="text-center"
//           style={{
//             fontSize: "var(--text-xs)",
//             color: "var(--color-text-hint)",
//             opacity: 0.7,
//           }}
//         >
//           Rolling 30-day window · Last updated{" "}
//           {new Date(scores.lastCalculatedAt).toLocaleTimeString("en-US", {
//             hour: "numeric",
//             minute: "2-digit",
//           })}
//         </p>
//       </div>
//     </div>
//   );
// }






// components/cdf/CdfScoreCard.tsx
"use client";

import { useState, useEffect } from "react";
import { CircularGauge }  from "@/components/cdf/CircularGauge";
import { CdfStreakBadge } from "@/components/cdf/CdfStreakBadge";
import { GRADE_COLOR, type CdfScoreDTO } from "@/types/cdf";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CdfScoreCardProps {
  scores: CdfScoreDTO;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatRow({
  label,
  value,
  color,
}: {
  label:  string;
  value:  string;
  color?: string;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "6px 0" }}
    >
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-hint)" }}>
        {label}
      </span>
      <span style={{
        fontSize:   "var(--text-sm)",
        fontWeight: 600,
        color:      color ?? "var(--color-text-primary)",
      }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      height:          "1px",
      backgroundColor: "var(--color-border-default)",
      margin:          "8px 0",
      opacity:         0.5,
    }} />
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-card"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border:          "1px solid var(--color-border-default)",
        padding:         "16px",
      }}
    >
      <p style={{
        fontSize:      "var(--text-xs)",
        fontWeight:    700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color:         "var(--color-text-accent)",
        marginBottom:  "12px",
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{
      height:          "6px",
      borderRadius:    "3px",
      backgroundColor: "var(--color-bg-header)",
      overflow:        "hidden",
      marginTop:       "12px",
    }}>
      <div style={{
        height:          "100%",
        borderRadius:    "3px",
        backgroundColor: color,
        width:           `${Math.min(Math.max(value, 0), 100)}%`,
        transition:      "width 0.8s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ─── Overall score ────────────────────────────────────────────────────────────
function OverallScore({ score }: { score: number }) {
  const color =
    score >= 80 ? "var(--color-today)"   :
    score >= 60 ? "var(--color-primary)" :
    score >= 40 ? "var(--color-warning)" :
    "var(--color-overdue)";

  return (
    <div
      className="flex flex-col items-center gap-1 py-4"
      style={{
        borderBottom:  "1px solid var(--color-border-default)",
        marginBottom:  "20px",
      }}
    >
      <p style={{
        fontSize:      "var(--text-xs)",
        fontWeight:    700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color:         "var(--color-text-hint)",
        marginBottom:  "8px",
      }}>
        Overall CDF Score
      </p>

      <div
        className="flex items-center justify-center"
        style={{
          width:           "80px",
          height:          "80px",
          borderRadius:    "50%",
          border:          `3px solid ${color}`,
          backgroundColor: `${color}15`,
          boxShadow:       `0 0 30px ${color}30`,
        }}
      >
        <span style={{ fontSize: "28px", fontWeight: 800, color }}>
          {score}
        </span>
      </div>

      <p style={{
        fontSize:  "var(--text-xs)",
        color:     "var(--color-text-hint)",
        marginTop: "4px",
      }}>
        C×40% + D×35% + F×25%
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CdfScoreCard({ scores }: CdfScoreCardProps) {
  // Mounted guard — prevents hydration mismatch on date formatting
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Gauges card ─────────────────────────────────────────────── */}
      <div
        className="rounded-card"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border:          "1px solid var(--color-border-default)",
          padding:         "20px",
        }}
      >
        <OverallScore score={scores.overallScore} />

        {/* 3 gauge grid */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 "8px",
          width:               "100%",
          padding:             "0 4px",
        }}>
          <CircularGauge
            score={scores.consistencyScore}
            grade={scores.consistencyGrade}
            label="C"
            streak={scores.consistencyStreak}
            showStreak={true}
          />
          <CircularGauge
            score={scores.disciplineScore}
            grade={scores.disciplineGrade}
            label="D"
          />
          <CircularGauge
            score={scores.focusScore}
            grade={scores.focusGrade}
            label="F"
          />
        </div>

        {/* Full labels below gauges */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 "4px",
          marginTop:           "8px",
        }}>
          {[
            { label: "Consistency", color: GRADE_COLOR[scores.consistencyGrade] },
            { label: "Discipline",  color: GRADE_COLOR[scores.disciplineGrade]  },
            { label: "Focus",       color: GRADE_COLOR[scores.focusGrade]       },
          ].map(({ label, color }) => (
            <p key={label} style={{
              textAlign:  "center",
              fontSize:   "var(--text-xs)",
              fontWeight: 600,
              color,
            }}>
              {label}
            </p>
          ))}
        </div>
      </div>

      {/* ── Consistency card ─────────────────────────────────────────── */}
      <SectionCard title="Consistency">
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <CdfStreakBadge
              streak={scores.consistencyStreak}
              longestStreak={scores.longestStreak}
            />
          </div>
          <div className="flex-1">
            <StatRow
              label="Completed"
              value={`${scores.totalCompleted}`}
              color="var(--color-today)"
            />
            <Divider />
            <StatRow
              label="Expected"
              value={`${scores.totalExpected}`}
            />
            <Divider />
            <StatRow
              label="Rate"
              value={
                scores.totalExpected > 0
                  ? `${Math.round((scores.totalCompleted / scores.totalExpected) * 100)}%`
                  : "N/A"
              }
              color="var(--color-accent)"
            />
          </div>
        </div>

        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-hint)" }}>
          <div className="flex justify-between mb-1">
            <span>30-day completion rate</span>
            <span style={{ color: "var(--color-text-secondary)" }}>
              {scores.totalCompleted}/{scores.totalExpected}
            </span>
          </div>
          <ProgressBar value={scores.consistencyScore} color="var(--color-today)" />
        </div>
      </SectionCard>

      {/* ── Discipline card ───────────────────────────────────────────── */}
      <SectionCard title="Discipline">
        <StatRow
          label="On-time completions"
          value={`${scores.onTimeCount}`}
          color="var(--color-success)"
        />
        <Divider />
        <StatRow
          label="Total timed tasks"
          value={`${scores.totalTimedTasks}`}
        />
        <Divider />
        <StatRow
          label="On-time rate"
          value={
            scores.totalTimedTasks > 0
              ? `${Math.round((scores.onTimeCount / scores.totalTimedTasks) * 100)}%`
              : "No timed tasks"
          }
          color="var(--color-accent)"
        />

        <ProgressBar value={scores.disciplineScore} color="var(--color-success)" />

        {scores.totalTimedTasks === 0 && (
          <p style={{
            fontSize:  "var(--text-xs)",
            color:     "var(--color-text-hint)",
            marginTop: "8px",
            fontStyle: "italic",
          }}>
            Set a due time on tasks to track discipline.
          </p>
        )}
      </SectionCard>

      {/* ── Focus card ────────────────────────────────────────────────── */}
      <SectionCard title="Focus">
        <StatRow
          label="Average focus score"
          value={`${Math.round(scores.focusScore)}/100`}
          color="var(--color-accent)"
        />
        <Divider />
        <StatRow
          label="Sessions logged"
          value={`${scores.focusEntries}`}
        />

        <ProgressBar
          value={scores.focusScore}
          color={
            scores.focusScore < 35 ? "var(--color-overdue)"  :
            scores.focusScore < 65 ? "var(--color-warning)"  :
            scores.focusScore < 80 ? "var(--color-primary)"  :
            "var(--color-today)"
          }
        />

        {scores.focusEntries === 0 && (
          <p style={{
            fontSize:  "var(--text-xs)",
            color:     "var(--color-text-hint)",
            marginTop: "8px",
            fontStyle: "italic",
          }}>
            Complete tasks with CDF on to log focus scores.
          </p>
        )}
      </SectionCard>

      {/* ── Window info ───────────────────────────────────────────────── */}
      {mounted && (
        <p
          className="text-center"
          style={{
            fontSize: "var(--text-xs)",
            color:    "var(--color-text-hint)",
            opacity:  0.7,
          }}
        >
          Rolling 30-day window · Last updated{" "}
          {new Date(scores.lastCalculatedAt).toLocaleTimeString("en-US", {
            hour:   "numeric",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}