// components/cdf/CircularGauge.tsx
"use client";

import { useMemo } from "react";
import type { CdfGrade } from "@/types/cdf";
import { GRADE_COLOR, GRADE_LABEL } from "@/types/cdf";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CircularGaugeProps {
  score: number;
  grade: CdfGrade;
  label: string;
  size?: number;
  streak?: number;
  showStreak?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const START_ANGLE = 135;
const SWEEP_ANGLE = 270;
const TRACK_COLOR = "rgba(21,101,168,0.2)";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
  ].join(" ");
}

// ─── Needle ───────────────────────────────────────────────────────────────────
function Needle({
  cx,
  cy,
  r,
  score,
  color,
}: {
  cx: number;
  cy: number;
  r: number;
  score: number;
  color: string;
}) {
  const angleDeg = START_ANGLE + (score / 100) * SWEEP_ANGLE;
  const tip = polarToCartesian(cx, cy, r * 0.72, angleDeg);
  const base1 = polarToCartesian(cx, cy, r * 0.12, angleDeg + 90);
  const base2 = polarToCartesian(cx, cy, r * 0.12, angleDeg - 90);
  return (
    <g>
      <polygon
        points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
        fill={color}
        opacity={0.9}
      />
      <circle cx={cx} cy={cy} r={r * 0.08} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.04} fill="white" opacity={0.6} />
    </g>
  );
}

// ─── Tick marks ───────────────────────────────────────────────────────────────
function TickMarks({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      {Array.from({ length: 11 }).map((_, i) => {
        const angle = START_ANGLE + (i / 10) * SWEEP_ANGLE;
        const inner = polarToCartesian(cx, cy, r * 0.82, angle);
        const outer = polarToCartesian(cx, cy, r * 0.92, angle);
        return (
          <line
            key={i}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={i % 2 === 0 ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CircularGauge({
  score,
  grade,
  label,
  size = 120,
  streak,
  showStreak = false,
}: CircularGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const color = GRADE_COLOR[grade];

  const zones = useMemo(
    () => [
      { from: 0, to: 35, color: GRADE_COLOR["F"] },
      { from: 35, to: 50, color: GRADE_COLOR["D"] },
      { from: 50, to: 65, color: GRADE_COLOR["C"] },
      { from: 65, to: 80, color: GRADE_COLOR["B"] },
      { from: 80, to: 95, color: GRADE_COLOR["A"] },
      { from: 95, to: 100, color: GRADE_COLOR["S"] },
    ],
    [],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* ── SVG gauge — fixed width/height, no "auto" ────────────────── */}
      <div style={{ width: "100%", aspectRatio: "1" }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          height="100%" // ← "100%" not "auto" — valid SVG attribute
          style={{ overflow: "visible", display: "block" }}
        >
          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={r * 1.15}
            fill="#0F4080" // ← explicit hex — CSS vars unreliable in SVG
            stroke="rgba(21,101,168,0.15)"
            strokeWidth={1}
          />

          {/* Track arc */}
          <path
            d={describeArc(cx, cy, r, START_ANGLE, START_ANGLE + SWEEP_ANGLE)}
            fill="none"
            stroke={TRACK_COLOR}
            strokeWidth={size * 0.075}
            strokeLinecap="round"
          />

          {/* Zone arcs — color gradient effect */}
          {zones.map((zone, i) => {
            if (zone.from >= score) return null;
            const zoneStart = START_ANGLE + (zone.from / 100) * SWEEP_ANGLE;
            const actualEnd =
              zone.to > score
                ? START_ANGLE + (score / 100) * SWEEP_ANGLE
                : START_ANGLE + (zone.to / 100) * SWEEP_ANGLE;
            return (
              <path
                key={i}
                d={describeArc(cx, cy, r, zoneStart, actualEnd)}
                fill="none"
                stroke={zone.color}
                strokeWidth={size * 0.075}
                strokeLinecap="round"
                opacity={0.85}
              />
            );
          })}

          {/* Tick marks */}
          <TickMarks cx={cx} cy={cy} r={r} />

          {/* Needle */}
          <Needle cx={cx} cy={cy} r={r} score={score} color={color} />

          {/* Min label */}
          <text
            x={polarToCartesian(cx, cy, r * 1.25, START_ANGLE).x}
            y={polarToCartesian(cx, cy, r * 1.25, START_ANGLE).y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={size * 0.08}
            fontFamily="Roboto, sans-serif"
          >
            0
          </text>

          {/* Max label */}
          <text
            x={polarToCartesian(cx, cy, r * 1.25, START_ANGLE + SWEEP_ANGLE).x}
            y={polarToCartesian(cx, cy, r * 1.25, START_ANGLE + SWEEP_ANGLE).y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={size * 0.08}
            fontFamily="Roboto, sans-serif"
          >
            100
          </text>

          {/* Center score */}
          <text
            x={cx}
            y={cy - r * 0.05}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={size * 0.22}
            fontWeight="700"
            fontFamily="Roboto, sans-serif"
          >
            {Math.round(score)}
          </text>

          {/* Grade letter */}
          <text
            x={cx}
            y={cy + r * 0.32}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={size * 0.11}
            fontWeight="600"
            fontFamily="Roboto, sans-serif"
            opacity={0.8}
          >
            {grade}
          </text>
        </svg>
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          textAlign: "center",
          marginTop: "2px",
        }}
      >
        {label}
      </p>

      {/* Grade label */}
      <p
        style={{
          fontSize: "var(--text-xs)",
          color,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {GRADE_LABEL[grade]}
      </p>

      {/* Streak badge — Consistency only */}
      {showStreak && streak !== undefined && streak > 0 && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-pill"
          style={{
            backgroundColor: "rgba(229,57,53,0.12)",
            border: "1px solid rgba(229,57,53,0.3)",
            marginTop: "2px",
          }}
        >
          <span style={{ fontSize: "11px" }}>🔥</span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--color-overdue)",
            }}
          >
            {streak}d
          </span>
        </div>
      )}
    </div>
  );
}

// // components/cdf/CircularGauge.tsx
// "use client";

// import { useMemo, useEffect, useState } from "react";
// import type { CdfGrade } from "@/types/cdf";
// import { GRADE_COLOR, GRADE_LABEL } from "@/types/cdf";

// interface CircularGaugeProps {
//   score:       number;
//   grade:       CdfGrade;
//   label:       string;
//   size?:       number;
//   streak?:     number;
//   showStreak?: boolean;
// }

// const TRACK_COLOR = "rgba(21, 101, 168, 0.2)";
// const START_ANGLE = 135;
// const SWEEP_ANGLE = 270;

// function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
//   const rad = ((angleDeg - 90) * Math.PI) / 180;
//   return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
// }

// function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
//   const start    = polarToCartesian(cx, cy, r, startAngle);
//   const end      = polarToCartesian(cx, cy, r, endAngle);
//   const largeArc = endAngle - startAngle > 180 ? 1 : 0;
//   return [`M ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`].join(" ");
// }

// function Needle({ cx, cy, r, score, color }: { cx: number; cy: number; r: number; score: number; color: string }) {
//   const angleDeg = START_ANGLE + (score / 100) * SWEEP_ANGLE;
//   const tip      = polarToCartesian(cx, cy, r * 0.72, angleDeg);
//   const base1    = polarToCartesian(cx, cy, r * 0.12, angleDeg + 90);
//   const base2    = polarToCartesian(cx, cy, r * 0.12, angleDeg - 90);
//   return (
//     <g>
//       <polygon points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`} fill={color} opacity={0.9} />
//       <circle cx={cx} cy={cy} r={r * 0.08} fill={color} />
//       <circle cx={cx} cy={cy} r={r * 0.04} fill="white" opacity={0.6} />
//     </g>
//   );
// }

// function TickMarks({ cx, cy, r, count = 10 }: { cx: number; cy: number; r: number; count?: number }) {
//   return (
//     <>
//       {Array.from({ length: count + 1 }).map((_, i) => {
//         const angle  = START_ANGLE + (i / count) * SWEEP_ANGLE;
//         const inner  = polarToCartesian(cx, cy, r * 0.82, angle);
//         const outer  = polarToCartesian(cx, cy, r * 0.92, angle);
//         const isMajor = i % 2 === 0;
//         return (
//           <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
//             stroke="rgba(255,255,255,0.2)" strokeWidth={isMajor ? 2 : 1} strokeLinecap="round" />
//         );
//       })}
//     </>
//   );
// }

// export function CircularGauge({ score, grade, label, size = 120, streak, showStreak = false }: CircularGaugeProps) {
//   const cx    = size / 2;
//   const cy    = size / 2;
//   const r     = size * 0.36;
//   const color = GRADE_COLOR[grade];
//   const trackEnd = START_ANGLE + SWEEP_ANGLE;

//   const zones = useMemo(() => [
//     { from: 0,  to: 35,  color: GRADE_COLOR["F"] },
//     { from: 35, to: 50,  color: GRADE_COLOR["D"] },
//     { from: 50, to: 65,  color: GRADE_COLOR["C"] },
//     { from: 65, to: 80,  color: GRADE_COLOR["B"] },
//     { from: 80, to: 95,  color: GRADE_COLOR["A"] },
//     { from: 95, to: 100, color: GRADE_COLOR["S"] },
//   ], []);

//   return (
//     <div className="flex flex-col items-center" style={{ gap: "4px", flex: 1, minWidth: 0 }}>
//       <svg
//         width="100%"
//         height="auto"
//         viewBox={`0 0 ${size} ${size}`}
//         style={{ overflow: "visible", maxWidth: `${size}px` }}
//       >
//         {/* Background circle */}
//         <circle cx={cx} cy={cy} r={r * 1.15}
//           fill="var(--color-bg-card)"
//           stroke="rgba(21,101,168,0.15)" strokeWidth={1}
//         />

//         {/* Track arc */}
//         <path d={describeArc(cx, cy, r, START_ANGLE, trackEnd)}
//           fill="none" stroke={TRACK_COLOR}
//           strokeWidth={size * 0.075} strokeLinecap="round"
//         />

//         {/* Zone arcs */}
//         {zones.map((zone, i) => {
//           const zoneStart = START_ANGLE + (zone.from / 100) * SWEEP_ANGLE;
//           const zoneEnd   = START_ANGLE + (zone.to   / 100) * SWEEP_ANGLE;
//           if (zone.from >= score) return null;
//           const actualEnd = zone.to > score
//             ? START_ANGLE + (score / 100) * SWEEP_ANGLE
//             : zoneEnd;
//           return (
//             <path key={i}
//               d={describeArc(cx, cy, r, zoneStart, actualEnd)}
//               fill="none" stroke={zone.color}
//               strokeWidth={size * 0.075} strokeLinecap="round" opacity={0.85}
//             />
//           );
//         })}

//         {/* Tick marks */}
//         <TickMarks cx={cx} cy={cy} r={r} />

//         {/* Needle */}
//         <Needle cx={cx} cy={cy} r={r} score={score} color={color} />

//         {/* 0 label */}
//         <text
//           x={polarToCartesian(cx, cy, r * 1.22, START_ANGLE).x}
//           y={polarToCartesian(cx, cy, r * 1.22, START_ANGLE).y}
//           textAnchor="middle" dominantBaseline="middle"
//           fill="rgba(255,255,255,0.35)"
//           fontSize={size * 0.075} fontFamily="Roboto, sans-serif"
//         >0</text>

//         {/* 100 label */}
//         <text
//           x={polarToCartesian(cx, cy, r * 1.22, START_ANGLE + SWEEP_ANGLE).x}
//           y={polarToCartesian(cx, cy, r * 1.22, START_ANGLE + SWEEP_ANGLE).y}
//           textAnchor="middle" dominantBaseline="middle"
//           fill="rgba(255,255,255,0.35)"
//           fontSize={size * 0.075} fontFamily="Roboto, sans-serif"
//         >100</text>

//         {/* Center score */}
//         <text x={cx} y={cy - r * 0.05}
//           textAnchor="middle" dominantBaseline="middle"
//           fill={color} fontSize={size * 0.22} fontWeight="700"
//           fontFamily="Roboto, sans-serif"
//         >{Math.round(score)}</text>

//         {/* Grade letter */}
//         <text x={cx} y={cy + r * 0.32}
//           textAnchor="middle" dominantBaseline="middle"
//           fill={color} fontSize={size * 0.11} fontWeight="600"
//           fontFamily="Roboto, sans-serif" opacity={0.8}
//         >{grade}</text>
//       </svg>

//       {/* Label */}
//       <p style={{
//         fontSize:      "var(--text-xs)",
//         fontWeight:    700,
//         color:         "var(--color-text-primary)",
//         letterSpacing: "0.5px",
//         textTransform: "uppercase",
//         textAlign:     "center",
//         marginTop:     "2px",
//       }}>
//         {label}
//       </p>

//       {/* Grade label */}
//       <p style={{ fontSize: "var(--text-xs)", color, fontWeight: 600, textAlign: "center" }}>
//         {GRADE_LABEL[grade]}
//       </p>

//       {/* Streak badge */}
//       {showStreak && streak !== undefined && streak > 0 && (
//         <div className="flex items-center gap-1 px-2 py-0.5 rounded-pill"
//           style={{
//             backgroundColor: "rgba(229,57,53,0.12)",
//             border:          "1px solid rgba(229,57,53,0.3)",
//             marginTop:       "2px",
//           }}
//         >
//           <span style={{ fontSize: "11px" }}>🔥</span>
//           <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-overdue)" }}>
//             {streak}d
//           </span>
//         </div>
//       )}
//     </div>
//   );
// }
