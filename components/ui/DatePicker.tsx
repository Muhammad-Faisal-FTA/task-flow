// // components/ui/DatePicker.tsx
// "use client";

// import { useState, useCallback, useMemo } from "react";
// import { ChevronLeft, ChevronRight, X } from "lucide-react";

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface DatePickerProps {
//   value: string | null; // "YYYY-MM-DD"
//   onChange: (date: string | null) => void;
//   onClose: () => void;
// }

// // ─── Constants ────────────────────────────────────────────────────────────────
// const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
// const MONTHS = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ];

// // Quick select options
// const QUICK_OPTIONS = [
//   {
//     label: "Today",
//     getValue: () => {
//       const d = new Date();
//       return toDateString(d);
//     },
//   },
//   {
//     label: "Tomorrow",
//     getValue: () => {
//       const d = new Date();
//       d.setDate(d.getDate() + 1);
//       return toDateString(d);
//     },
//   },
//   {
//     label: "Next Week",
//     getValue: () => {
//       const d = new Date();
//       d.setDate(d.getDate() + 7);
//       return toDateString(d);
//     },
//   },
// ];

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function toDateString(d: Date): string {
//   return d.toISOString().split("T")[0];
// }

// function parseDate(str: string | null): Date | null {
//   if (!str) return null;
//   const d = new Date(str + "T00:00:00");
//   return isNaN(d.getTime()) ? null : d;
// }

// function isSameDay(a: Date, b: Date): boolean {
//   return (
//     a.getFullYear() === b.getFullYear() &&
//     a.getMonth() === b.getMonth() &&
//     a.getDate() === b.getDate()
//   );
// }

// function getDaysInMonth(year: number, month: number): number {
//   return new Date(year, month + 1, 0).getDate();
// }

// function getFirstDayOfMonth(year: number, month: number): number {
//   return new Date(year, month, 1).getDay();
// }

// // ─── Component ────────────────────────────────────────────────────────────────
// export function DatePicker({ value, onChange, onClose }: DatePickerProps) {
//   const today = useMemo(() => new Date(), []);
//   const selected = useMemo(() => parseDate(value), [value]);

//   // Calendar view state — start on selected month or today
//   const [viewYear, setViewYear] = useState(
//     selected?.getFullYear() ?? today.getFullYear(),
//   );
//   const [viewMonth, setViewMonth] = useState(
//     selected?.getMonth() ?? today.getMonth(),
//   );

//   // ── Navigation ────────────────────────────────────────────────────────────
//   const prevMonth = useCallback(() => {
//     setViewMonth((m) => {
//       if (m === 0) {
//         setViewYear((y) => y - 1);
//         return 11;
//       }
//       return m - 1;
//     });
//   }, []);

//   const nextMonth = useCallback(() => {
//     setViewMonth((m) => {
//       if (m === 11) {
//         setViewYear((y) => y + 1);
//         return 0;
//       }
//       return m + 1;
//     });
//   }, []);

//   // ── Calendar grid ─────────────────────────────────────────────────────────
//   const daysInMonth = getDaysInMonth(viewYear, viewMonth);
//   const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth);

//   // Build grid — empty cells before first day + day numbers
//   const gridCells = useMemo(() => {
//     const cells: (number | null)[] = [];
//     for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
//     for (let d = 1; d <= daysInMonth; d++) cells.push(d);
//     // Pad to complete last row
//     while (cells.length % 7 !== 0) cells.push(null);
//     return cells;
//   }, [daysInMonth, firstDayOfWeek]);

//   // ── Select day ────────────────────────────────────────────────────────────
//   const selectDay = useCallback(
//     (day: number) => {
//       const d = new Date(viewYear, viewMonth, day);
//       onChange(toDateString(d));
//     },
//     [viewYear, viewMonth, onChange],
//   );

//   // ── Day cell state ────────────────────────────────────────────────────────
//   const getDayState = useCallback(
//     (day: number) => {
//       const d = new Date(viewYear, viewMonth, day);
//       const isToday = isSameDay(d, today);
//       const isSelected = selected ? isSameDay(d, selected) : false;
//       const isPast =
//         d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
//       return { isToday, isSelected, isPast };
//     },
//     [viewYear, viewMonth, today, selected],
//   );

//   return (
//     <div
//       style={{
//         backgroundColor: "var(--color-bg-card)",
//         border: "1px solid var(--color-border-default)",
//         borderRadius: "var(--radius-card)",
//         padding: "16px",
//         width: "100%",
//       }}
//     >
//       {/* ── Quick select ───────────────────────────────────────────────── */}
//       <div className="flex gap-2 mb-4">
//         {QUICK_OPTIONS.map((opt) => {
//           const val = opt.getValue();
//           const isActive = value === val;
//           return (
//             <button
//               key={opt.label}
//               onClick={() => onChange(val)}
//               style={{
//                 flex: 1,
//                 padding: "6px 4px",
//                 borderRadius: "var(--radius-input)",
//                 fontSize: "var(--text-xs)",
//                 fontWeight: 600,
//                 border: `1.5px solid ${
//                   isActive
//                     ? "var(--color-primary)"
//                     : "var(--color-border-default)"
//                 }`,
//                 backgroundColor: isActive
//                   ? "var(--color-primary)"
//                   : "transparent",
//                 color: isActive ? "#ffffff" : "var(--color-text-secondary)",
//                 cursor: "pointer",
//                 transition: "all 0.15s ease",
//               }}
//             >
//               {opt.label}
//             </button>
//           );
//         })}

//         {/* Clear button */}
//         {value && (
//           <button
//             onClick={() => onChange(null)}
//             style={{
//               padding: "6px 8px",
//               borderRadius: "var(--radius-input)",
//               fontSize: "var(--text-xs)",
//               border: "1.5px solid var(--color-border-error)",
//               backgroundColor: "transparent",
//               color: "var(--color-overdue)",
//               cursor: "pointer",
//               display: "flex",
//               alignItems: "center",
//               gap: "4px",
//             }}
//           >
//             <X style={{ width: "11px", height: "11px" }} />
//             Clear
//           </button>
//         )}
//       </div>

//       {/* ── Month navigation ───────────────────────────────────────────── */}
//       <div className="flex items-center justify-between mb-3">
//         <button
//           onClick={prevMonth}
//           style={{
//             width: "32px",
//             height: "32px",
//             borderRadius: "var(--radius-input)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             backgroundColor: "var(--color-bg-header)",
//             border: "1px solid var(--color-border-default)",
//             color: "var(--color-text-secondary)",
//             cursor: "pointer",
//           }}
//         >
//           <ChevronLeft style={{ width: "16px", height: "16px" }} />
//         </button>

//         <span
//           style={{
//             fontSize: "var(--text-base)",
//             fontWeight: 600,
//             color: "var(--color-text-primary)",
//           }}
//         >
//           {MONTHS[viewMonth]} {viewYear}
//         </span>

//         <button
//           onClick={nextMonth}
//           style={{
//             width: "32px",
//             height: "32px",
//             borderRadius: "var(--radius-input)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             backgroundColor: "var(--color-bg-header)",
//             border: "1px solid var(--color-border-default)",
//             color: "var(--color-text-secondary)",
//             cursor: "pointer",
//           }}
//         >
//           <ChevronRight style={{ width: "16px", height: "16px" }} />
//         </button>
//       </div>

//       {/* ── Day headers ────────────────────────────────────────────────── */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(7, 1fr)",
//           gap: "2px",
//           marginBottom: "4px",
//         }}
//       >
//         {DAYS.map((d) => (
//           <div
//             key={d}
//             style={{
//               textAlign: "center",
//               fontSize: "var(--text-xs)",
//               fontWeight: 600,
//               color: "var(--color-text-hint)",
//               padding: "4px 0",
//             }}
//           >
//             {d}
//           </div>
//         ))}
//       </div>

//       {/* ── Day grid ───────────────────────────────────────────────────── */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(7, 1fr)",
//           gap: "2px",
//         }}
//       >
//         {gridCells.map((day, i) => {
//           if (day === null) {
//             return <div key={`empty-${i}`} />;
//           }

//           const { isToday, isSelected, isPast } = getDayState(day);

//           return (
//             <button
//               key={day}
//               onClick={() => !isPast && selectDay(day)}
//               disabled={isPast}
//               style={{
//                 aspectRatio: "1",
//                 borderRadius: "var(--radius-input)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: "var(--text-sm)",
//                 fontWeight: isSelected || isToday ? 600 : 400,
//                 cursor: isPast ? "not-allowed" : "pointer",
//                 border:
//                   isToday && !isSelected
//                     ? "1.5px solid var(--color-primary)"
//                     : "1.5px solid transparent",
//                 backgroundColor: isSelected
//                   ? "var(--color-primary)"
//                   : "transparent",
//                 color: isSelected
//                   ? "#ffffff"
//                   : isPast
//                     ? "var(--color-text-hint)"
//                     : isToday
//                       ? "var(--color-today)"
//                       : "var(--color-text-primary)",
//                 opacity: isPast ? 0.4 : 1,
//                 transition: "all 0.15s ease",
//               }}
//             >
//               {day}
//             </button>
//           );
//         })}
//       </div>

//       {/* ── Selected date display ───────────────────────────────────────── */}
//       {value && (
//         <div
//           style={{
//             marginTop: "12px",
//             padding: "8px 12px",
//             borderRadius: "var(--radius-input)",
//             backgroundColor: "var(--color-bg-header)",
//             fontSize: "var(--text-sm)",
//             color: "var(--color-text-secondary)",
//             textAlign: "center",
//           }}
//         >
//           Selected:{" "}
//           <strong style={{ color: "var(--color-text-primary)" }}>
//             {new Date(value + "T00:00:00").toLocaleDateString("en-US", {
//               weekday: "long",
//               month: "long",
//               day: "numeric",
//               year: "numeric",
//             })}
//           </strong>
//         </div>
//       )}
//     </div>
//   );
// }

// // components/ui/DatePicker.tsx
// "use client";

// import { useState, useCallback, useMemo, useEffect } from "react";
// import { ChevronLeft, ChevronRight, X } from "lucide-react";

// interface DatePickerProps {
//   value:    string | null;
//   onChange: (date: string | null) => void;
//   onClose:  () => void;
// }

// const DAYS   = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
// const MONTHS = [
//   "January","February","March","April","May","June",
//   "July","August","September","October","November","December",
// ];

// const QUICK_OPTIONS = [
//   {
//     label: "Today",
//     getValue: () => toDateString(new Date()),
//   },
//   {
//     label: "Tomorrow",
//     getValue: () => {
//       const d = new Date();
//       d.setDate(d.getDate() + 1);
//       return toDateString(d);
//     },
//   },
//   {
//     label: "Next Week",
//     getValue: () => {
//       const d = new Date();
//       d.setDate(d.getDate() + 7);
//       return toDateString(d);
//     },
//   },
// ];

// // ─── Local-timezone safe helpers ──────────────────────────────────────────────
// function toDateString(d: Date): string {
//   const year  = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const day   = String(d.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// }

// function parseLocalDate(str: string | null): Date | null {
//   if (!str) return null;
//   const parts = str.split("-").map(Number);
//   if (parts.length !== 3) return null;
//   const [year, month, day] = parts;
//   const d = new Date(year, month - 1, day); // ← local timezone
//   return isNaN(d.getTime()) ? null : d;
// }

// function isSameDay(a: Date, b: Date): boolean {
//   return (
//     a.getFullYear() === b.getFullYear() &&
//     a.getMonth()    === b.getMonth()    &&
//     a.getDate()     === b.getDate()
//   );
// }

// function getDaysInMonth(year: number, month: number): number {
//   return new Date(year, month + 1, 0).getDate();
// }

// function getFirstDayOfMonth(year: number, month: number): number {
//   return new Date(year, month, 1).getDay();
// }

// // ─── Component ────────────────────────────────────────────────────────────────
// export function DatePicker({ value, onChange, onClose }: DatePickerProps) {
//   // const today    = useMemo(() => new Date(), []);

//   const [today, setToday] = useState<Date | null>(null);
//   useEffect(() => {
//     setToday(new Date());
//   }, []);

//   const selected = useMemo(() => parseLocalDate(value), [value]);

//   const [viewYear,  setViewYear]  = useState(
//     selected?.getFullYear()  ?? today.getFullYear()
//   );
//   const [viewMonth, setViewMonth] = useState(
//     selected?.getMonth()     ?? today.getMonth()
//   );

//   const prevMonth = useCallback(() => {
//     setViewMonth(m => {
//       if (m === 0) { setViewYear(y => y - 1); return 11; }
//       return m - 1;
//     });
//   }, []);

//   const nextMonth = useCallback(() => {
//     setViewMonth(m => {
//       if (m === 11) { setViewYear(y => y + 1); return 0; }
//       return m + 1;
//     });
//   }, []);

//   const daysInMonth    = getDaysInMonth(viewYear, viewMonth);
//   const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth);

//   const gridCells = useMemo(() => {
//     const cells: (number | null)[] = [];
//     for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
//     for (let d = 1; d <= daysInMonth; d++) cells.push(d);
//     while (cells.length % 7 !== 0) cells.push(null);
//     return cells;
//   }, [daysInMonth, firstDayOfWeek]);

//   // ── Select day — local timezone ────────────────────────────────────────────
//   const selectDay = useCallback((day: number) => {
//     const d = new Date(viewYear, viewMonth, day); // local date
//     onChange(toDateString(d));
//   }, [viewYear, viewMonth, onChange]);

//   // const getDayState = useCallback((day: number) => {
//   //   const d         = new Date(viewYear, viewMonth, day); // local
//   //   const todayLocal = new Date(
//   //     today.getFullYear(),
//   //     today.getMonth(),
//   //     today.getDate()
//   //   );
//   //   const isToday    = isSameDay(d, todayLocal);
//   //   const isSelected = selected ? isSameDay(d, selected) : false;
//   //   const isPast     = d < todayLocal;
//   //   return { isToday, isSelected, isPast };
//   // }, [viewYear, viewMonth, today, selected]);
  
//   // Guard getDayState
// const getDayState = useCallback((day: number) => {
//   if (!today) return { isToday: false, isSelected: false, isPast: false };

//   const d = new Date(viewYear, viewMonth, day);
//   const todayLocal = new Date(
//     today.getFullYear(),
//     today.getMonth(),
//     today.getDate()
//   );
//   const isToday    = isSameDay(d, todayLocal);
//   const isSelected = selected ? isSameDay(d, selected) : false;
//   const isPast     = d < todayLocal;
//   return { isToday, isSelected, isPast };
// }, [viewYear, viewMonth, today, selected]);


//   return (
//     <div
//       style={{
//         backgroundColor: "var(--color-bg-card)",
//         border:          "1px solid var(--color-border-default)",
//         borderRadius:    "var(--radius-card)",
//         padding:         "16px",
//         width:           "100%",
//       }}
//     >
//       {/* Quick select */}
//       <div className="flex gap-2 mb-4">
//         {QUICK_OPTIONS.map(opt => {
//           const val      = opt.getValue();
//           const isActive = value === val;
//           return (
//             <button
//               key={opt.label}
//               onClick={() => onChange(val)}
//               style={{
//                 flex:            1,
//                 padding:         "6px 4px",
//                 borderRadius:    "var(--radius-input)",
//                 fontSize:        "var(--text-xs)",
//                 fontWeight:      600,
//                 border:          `1.5px solid ${isActive ? "var(--color-primary)" : "var(--color-border-default)"}`,
//                 backgroundColor: isActive ? "var(--color-primary)" : "transparent",
//                 color:           isActive ? "#ffffff" : "var(--color-text-secondary)",
//                 cursor:          "pointer",
//                 transition:      "all 0.15s ease",
//               }}
//             >
//               {opt.label}
//             </button>
//           );
//         })}

//         {value && (
//           <button
//             onClick={() => onChange(null)}
//             style={{
//               padding:         "6px 8px",
//               borderRadius:    "var(--radius-input)",
//               fontSize:        "var(--text-xs)",
//               border:          "1.5px solid var(--color-border-error)",
//               backgroundColor: "transparent",
//               color:           "var(--color-overdue)",
//               cursor:          "pointer",
//               display:         "flex",
//               alignItems:      "center",
//               gap:             "4px",
//             }}
//           >
//             <X style={{ width: "11px", height: "11px" }} />
//             Clear
//           </button>
//         )}
//       </div>

//       {/* Month navigation */}
//       <div className="flex items-center justify-between mb-3">
//         <button
//           onClick={prevMonth}
//           style={{
//             width:           "32px",
//             height:          "32px",
//             borderRadius:    "var(--radius-input)",
//             display:         "flex",
//             alignItems:      "center",
//             justifyContent:  "center",
//             backgroundColor: "var(--color-bg-header)",
//             border:          "1px solid var(--color-border-default)",
//             color:           "var(--color-text-secondary)",
//             cursor:          "pointer",
//           }}
//         >
//           <ChevronLeft style={{ width: "16px", height: "16px" }} />
//         </button>

//         <span style={{
//           fontSize:   "var(--text-base)",
//           fontWeight: 600,
//           color:      "var(--color-text-primary)",
//         }}>
//           {MONTHS[viewMonth]} {viewYear}
//         </span>

//         <button
//           onClick={nextMonth}
//           style={{
//             width:           "32px",
//             height:          "32px",
//             borderRadius:    "var(--radius-input)",
//             display:         "flex",
//             alignItems:      "center",
//             justifyContent:  "center",
//             backgroundColor: "var(--color-bg-header)",
//             border:          "1px solid var(--color-border-default)",
//             color:           "var(--color-text-secondary)",
//             cursor:          "pointer",
//           }}
//         >
//           <ChevronRight style={{ width: "16px", height: "16px" }} />
//         </button>
//       </div>

//       {/* Day headers */}
//       <div style={{
//         display:             "grid",
//         gridTemplateColumns: "repeat(7, 1fr)",
//         gap:                 "2px",
//         marginBottom:        "4px",
//       }}>
//         {DAYS.map(d => (
//           <div key={d} style={{
//             textAlign:  "center",
//             fontSize:   "var(--text-xs)",
//             fontWeight: 600,
//             color:      "var(--color-text-hint)",
//             padding:    "4px 0",
//           }}>
//             {d}
//           </div>
//         ))}
//       </div>

//       {/* Day grid */}
//       <div style={{
//         display:             "grid",
//         gridTemplateColumns: "repeat(7, 1fr)",
//         gap:                 "2px",
//       }}>
//         {gridCells.map((day, i) => {
//           if (day === null) return <div key={`e-${i}`} />;

//           const { isToday, isSelected, isPast } = getDayState(day);

//           return (
//             <button
//               key={day}
//               onClick={() => !isPast && selectDay(day)}
//               disabled={isPast}
//               style={{
//                 aspectRatio:     "1",
//                 borderRadius:    "var(--radius-input)",
//                 display:         "flex",
//                 alignItems:      "center",
//                 justifyContent:  "center",
//                 fontSize:        "var(--text-sm)",
//                 fontWeight:      isSelected || isToday ? 700 : 400,
//                 cursor:          isPast ? "not-allowed" : "pointer",
//                 border:          isToday && !isSelected
//                   ? "1.5px solid var(--color-primary)"
//                   : "1.5px solid transparent",
//                 backgroundColor: isSelected
//                   ? "var(--color-primary)"
//                   : "transparent",
//                 color: isSelected
//                   ? "#ffffff"
//                   : isPast
//                   ? "var(--color-text-hint)"
//                   : isToday
//                   ? "var(--color-today)"
//                   : "var(--color-text-primary)",
//                 opacity:    isPast ? 0.4 : 1,
//                 transition: "all 0.15s ease",
//               }}
//             >
//               {day}
//             </button>
//           );
//         })}
//       </div>

//       {/* Selected date display */}
//       {value && (
//         <div style={{
//           marginTop:       "12px",
//           padding:         "8px 12px",
//           borderRadius:    "var(--radius-input)",
//           backgroundColor: "var(--color-bg-header)",
//           fontSize:        "var(--text-sm)",
//           color:           "var(--color-text-secondary)",
//           textAlign:       "center",
//         }}>
//           Selected:{" "}
//           <strong style={{ color: "var(--color-text-primary)" }}>
//             {(() => {
//               const [y, m, d] = value.split("-").map(Number);
//               return new Date(y, m - 1, d).toLocaleDateString("en-US", {
//                 weekday: "long",
//                 month:   "long",
//                 day:     "numeric",
//                 year:    "numeric",
//               });
//             })()}
//           </strong>
//         </div>
//       )}
//     </div>
//   );
// }



// components/ui/DatePicker.tsx
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, X }              from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DatePickerProps {
  value:    string | null;
  onChange: (date: string | null) => void;
  onClose:  () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTHS = [
  "January", "February", "March",     "April",   "May",      "June",
  "July",    "August",   "September", "October", "November", "December",
];

const QUICK_OPTIONS = [
  {
    label:    "Today",
    getValue: () => toDateString(new Date()),
  },
  {
    label:    "Tomorrow",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return toDateString(d);
    },
  },
  {
    label:    "Next Week",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return toDateString(d);
    },
  },
];

// ─── Local-timezone safe helpers ──────────────────────────────────────────────

// Build "YYYY-MM-DD" from local date — never UTC
function toDateString(d: Date): string {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day   = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Parse "YYYY-MM-DD" as LOCAL date — never UTC
function parseLocalDate(str: string | null): Date | null {
  if (!str) return null;
  const parts = str.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DatePicker({ value, onChange }: DatePickerProps) {
  const selected = useMemo(() => parseLocalDate(value), [value]);

  // today is null on server — set on client only to avoid hydration mismatch
  const [today, setToday] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setToday(new Date()); }, []);

  // Initialise view to selected month, or current month using fallback
  const [viewYear,  setViewYear]  = useState<number>(
    () => selected?.getFullYear()  ?? new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    () => selected?.getMonth()     ?? new Date().getMonth()
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  const prevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  // ── Grid ──────────────────────────────────────────────────────────────────
  const daysInMonth    = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth);

  const gridCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [daysInMonth, firstDayOfWeek]);

  // ── Day selection ─────────────────────────────────────────────────────────
  const selectDay = useCallback((day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toDateString(d));
  }, [viewYear, viewMonth, onChange]);

  // ── Day state — safe when today is null (SSR) ─────────────────────────────
  const getDayState = useCallback((day: number) => {
    const d = new Date(viewYear, viewMonth, day);

    if (!today) {
      // Server render — no today available yet
      const isSelected = selected ? isSameDay(d, selected) : false;
      return { isToday: false, isSelected, isPast: false };
    }

    const todayLocal = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return {
      isToday:    isSameDay(d, todayLocal),
      isSelected: selected ? isSameDay(d, selected) : false,
      isPast:     d < todayLocal,
    };
  }, [viewYear, viewMonth, today, selected]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-card)",
        border:          "1px solid var(--color-border-default)",
        borderRadius:    "var(--radius-card)",
        padding:         "16px",
        width:           "100%",
      }}
    >
      {/* ── Quick select ─────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        {QUICK_OPTIONS.map(opt => {
          const val      = opt.getValue();
          const isActive = value === val;
          return (
            <button
              key={opt.label}
              onClick={() => onChange(val)}
              style={{
                flex:            1,
                padding:         "6px 4px",
                borderRadius:    "var(--radius-input)",
                fontSize:        "var(--text-xs)",
                fontWeight:      600,
                border:          `1.5px solid ${isActive
                  ? "var(--color-primary)"
                  : "var(--color-border-default)"}`,
                backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                color:           isActive ? "#ffffff" : "var(--color-text-secondary)",
                cursor:          "pointer",
                transition:      "all 0.15s ease",
              }}
            >
              {opt.label}
            </button>
          );
        })}

        {value && (
          <button
            onClick={() => onChange(null)}
            style={{
              padding:         "6px 8px",
              borderRadius:    "var(--radius-input)",
              fontSize:        "var(--text-xs)",
              border:          "1.5px solid var(--color-border-error, #e53935)",
              backgroundColor: "transparent",
              color:           "var(--color-overdue)",
              cursor:          "pointer",
              display:         "flex",
              alignItems:      "center",
              gap:             "4px",
            }}
          >
            <X style={{ width: "11px", height: "11px" }} />
            Clear
          </button>
        )}
      </div>

      {/* ── Month navigation ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          style={{
            width:           "32px",
            height:          "32px",
            borderRadius:    "var(--radius-input)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            backgroundColor: "var(--color-bg-header)",
            border:          "1px solid var(--color-border-default)",
            color:           "var(--color-text-secondary)",
            cursor:          "pointer",
          }}
        >
          <ChevronLeft style={{ width: "16px", height: "16px" }} />
        </button>

        <span style={{
          fontSize:   "var(--text-base)",
          fontWeight: 600,
          color:      "var(--color-text-primary)",
        }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          style={{
            width:           "32px",
            height:          "32px",
            borderRadius:    "var(--radius-input)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            backgroundColor: "var(--color-bg-header)",
            border:          "1px solid var(--color-border-default)",
            color:           "var(--color-text-secondary)",
            cursor:          "pointer",
          }}
        >
          <ChevronRight style={{ width: "16px", height: "16px" }} />
        </button>
      </div>

      {/* ── Day headers ──────────────────────────────────────────────── */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap:                 "2px",
        marginBottom:        "4px",
      }}>
        {DAYS.map(d => (
          <div
            key={d}
            style={{
              textAlign:  "center",
              fontSize:   "var(--text-xs)",
              fontWeight: 600,
              color:      "var(--color-text-hint)",
              padding:    "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ─────────────────────────────────────────────────── */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap:                 "2px",
      }}>
        {gridCells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const { isToday, isSelected, isPast } = getDayState(day);

          return (
            <button
              key={day}
              onClick={() => !isPast && selectDay(day)}
              disabled={isPast}
              style={{
                aspectRatio:     "1",
                borderRadius:    "var(--radius-input)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                fontSize:        "var(--text-sm)",
                fontWeight:      isSelected || isToday ? 700 : 400,
                cursor:          isPast ? "not-allowed" : "pointer",
                border:          isToday && !isSelected
                  ? "1.5px solid var(--color-primary)"
                  : "1.5px solid transparent",
                backgroundColor: isSelected
                  ? "var(--color-primary)"
                  : "transparent",
                color: isSelected
                  ? "#ffffff"
                  : isPast
                  ? "var(--color-text-hint)"
                  : isToday
                  ? "var(--color-today)"
                  : "var(--color-text-primary)",
                opacity:    isPast ? 0.35 : 1,
                transition: "all 0.15s ease",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* ── Selected date display ─────────────────────────────────────── */}
      {value && (
        <div
          suppressHydrationWarning
          style={{
            marginTop:       "12px",
            padding:         "8px 12px",
            borderRadius:    "var(--radius-input)",
            backgroundColor: "var(--color-bg-header)",
            fontSize:        "var(--text-sm)",
            color:           "var(--color-text-secondary)",
            textAlign:       "center",
          }}
        >
          Selected:{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>
            {(() => {
              const [y, m, d] = value.split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("en-US", {
                weekday: "long",
                month:   "long",
                day:     "numeric",
                year:    "numeric",
              });
            })()}
          </strong>
        </div>
      )}
    </div>
  );
}