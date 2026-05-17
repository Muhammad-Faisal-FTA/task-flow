// /* eslint-disable @typescript-eslint/ban-ts-comment */
// // components/cdf/FocusPopup.tsx
"use client";

import { useCallback, useRef, useEffect } from "react";
import { Brain, Zap, Target, TrendingUp } from "lucide-react";
import type { FocusPopupState } from "@/types/cdf";
import { GRADE_COLOR, GRADE_LABEL, getGrade } from "@/types/cdf";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FocusPopupProps {
  popup: FocusPopupState;
  isSubmitting: boolean;
  onSetScore: (score: number) => void;
  onSubmit: () => Promise<void>;
  // No onClose — focus is mandatory when CDF is ON
}

// ─── Focus level descriptors ──────────────────────────────────────────────────
function getFocusDescriptor(score: number): {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
} {
  const iconStyle = { width: "20px", height: "20px" };

  if (score >= 90)
    return {
      label: "Deep Flow",
      description: "Completely immersed. Zero distractions.",
      icon: <Zap style={iconStyle} />,
      color: GRADE_COLOR["S"],
    };
  if (score >= 75)
    return {
      label: "Focused",
      description: "Highly concentrated with minor breaks.",
      icon: <Target style={iconStyle} />,
      color: GRADE_COLOR["A"],
    };
  if (score >= 55)
    return {
      label: "Moderate",
      description: "On task but some distractions.",
      icon: <TrendingUp style={iconStyle} />,
      color: GRADE_COLOR["B"],
    };
  if (score >= 35)
    return {
      label: "Distracted",
      description: "Frequent interruptions, hard to focus.",
      icon: <Brain style={iconStyle} />,
      color: GRADE_COLOR["C"],
    };
  return {
    label: "Scattered",
    description: "Could barely concentrate.",
    icon: <Brain style={iconStyle} />,
    color: GRADE_COLOR["D"],
  };
}

// ─── Slider track gradient ─────────────────────────────────────────────────────
const SLIDER_GRADIENT = `linear-gradient(
  to right,
  ${GRADE_COLOR["F"]}   0%,
  ${GRADE_COLOR["D"]}  35%,
  ${GRADE_COLOR["C"]}  50%,
  ${GRADE_COLOR["B"]}  65%,
  ${GRADE_COLOR["A"]}  80%,
  ${GRADE_COLOR["S"]} 100%
)`;

// ─── Component ────────────────────────────────────────────────────────────────
export function FocusPopup({
  popup,
  isSubmitting,
  onSetScore,
  onSubmit,
}: FocusPopupProps) {
  const sliderRef = useRef<HTMLInputElement>(null);

  // Focus slider on open
  useEffect(() => {
    if (popup.isOpen) {
      setTimeout(() => sliderRef.current?.focus(), 300);
    }
  }, [popup.isOpen]);

  const grade = getGrade(popup.score);
  const gradeColor = GRADE_COLOR[grade];
  const descriptor = getFocusDescriptor(popup.score);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSetScore(Number(e.target.value));
    },
    [onSetScore],
  );

  if (!popup.isOpen) return null;

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          // No onClick — mandatory, cannot dismiss by tapping backdrop
        }}
      />

      {/* ── Modal ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          width: "calc(100% - 32px)",
          maxWidth: "380px",
          backgroundColor: "var(--color-bg-header)",
          borderRadius: "var(--radius-xl)",
          border: `1px solid ${gradeColor}40`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 40px ${gradeColor}20`,
          overflow: "hidden",
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--color-border-default)",
            background: `linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-header) 100%)`,
          }}
        >
          {/* CDF badge */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill"
              style={{
                backgroundColor: "rgba(41,182,246,0.1)",
                border: "1px solid rgba(41,182,246,0.3)",
              }}
            >
              <span style={{ fontSize: "11px" }}>⚡</span>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  color: "var(--color-today)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                CDF Focus
              </span>
            </div>
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-hint)",
              }}
            >
              Required
            </span>
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: "4px",
            }}
          >
            How focused were you?
          </h2>

          {/* Task name */}
          <p
            className="truncate"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-hint)",
            }}
          >
            Task:{" "}
            <span style={{ color: "var(--color-text-secondary)" }}>
              {popup.taskTitle}
            </span>
          </p>
        </div>

        {/* ── Score display ─────────────────────────────────────────── */}
        <div style={{ padding: "20px 20px 0" }}>
          {/* Big score number */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Score circle */}
            <div
              className="flex flex-col items-center justify-center"
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "50%",
                border: `3px solid ${gradeColor}`,
                backgroundColor: `${gradeColor}15`,
                boxShadow: `0 0 24px ${gradeColor}30`,
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: gradeColor,
                  lineHeight: 1,
                  transition: "color 0.2s ease",
                }}
              >
                {popup.score}
              </span>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: gradeColor,
                  fontWeight: 700,
                  opacity: 0.8,
                }}
              >
                {grade}
              </span>
            </div>

            {/* Descriptor */}
            <div className="flex-1">
              <div
                className="flex items-center gap-2 mb-1"
                style={{ color: descriptor.color }}
              >
                {descriptor.icon}
                <span
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 700,
                    color: descriptor.color,
                  }}
                >
                  {descriptor.label}
                </span>
              </div>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-hint)",
                  lineHeight: 1.4,
                }}
              >
                {descriptor.description}
              </p>
            </div>
          </div>

          {/* ── Slider ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: "16px" }}>
            {/* Slider track labels */}
            <div
              className="flex justify-between mb-2"
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-hint)",
              }}
            >
              <span>Scattered</span>
              <span>Deep Flow</span>
            </div>

            {/* Custom styled range input */}
            <div style={{ position: "relative" }}>
              {/* Gradient track background */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: "6px",
                  transform: "translateY(-50%)",
                  borderRadius: "3px",
                  background: SLIDER_GRADIENT,
                  opacity: 0.4,
                  pointerEvents: "none",
                }}
              />

              {/* Filled portion */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  width: `${popup.score}%`,
                  height: "6px",
                  transform: "translateY(-50%)",
                  borderRadius: "3px",
                  background: SLIDER_GRADIENT,
                  backgroundSize: "380px 6px",
                  pointerEvents: "none",
                  transition: "width 0.1s ease",
                }}
              />

              <input
                ref={sliderRef}
                type="range"
                min={0}
                max={100}
                step={1}
                value={popup.score}
                onChange={handleSliderChange}
                style={{
                  position: "relative",
                  width: "100%",
                  height: "6px",
                  appearance: "none",
                  WebkitAppearance: "none",
                  background: "transparent",
                  cursor: "pointer",
                  outline: "none",
                  //  Thumb styles via CSS vars trick
                  //  @ts-expect-error
                  "--thumb-color": gradeColor,
                }}
              />
            </div>

            {/* Score notches */}
            <div
              className="flex justify-between mt-1.5"
              style={{
                fontSize: "10px",
                color: "var(--color-text-hint)",
                opacity: 0.6,
              }}
            >
              {[0, 25, 50, 75, 100].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>

          {/* ── Quick select buttons ──────────────────────────────────── */}
          <div className="flex gap-2 mb-5">
            {[
              { label: "0", value: 0 },
              { label: "25", value: 25 },
              { label: "50", value: 50 },
              { label: "75", value: 75 },
              { label: "100", value: 100 },
            ].map((opt) => {
              const isActive = popup.score === opt.value;
              const optGrade = getGrade(opt.value);
              const optColor = GRADE_COLOR[optGrade];

              return (
                <button
                  key={opt.value}
                  onClick={() => onSetScore(opt.value)}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    borderRadius: "var(--radius-input)",
                    fontSize: "var(--text-xs)",
                    fontWeight: isActive ? 700 : 500,
                    border: `1.5px solid ${isActive ? optColor : "var(--color-border-default)"}`,
                    backgroundColor: isActive ? `${optColor}20` : "transparent",
                    color: isActive ? optColor : "var(--color-text-hint)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Submit button ─────────────────────────────────────────── */}
        <div
          style={{
            padding: "0 20px 20px",
          }}
        >
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "var(--radius-btn)",
              fontSize: "var(--text-md)",
              fontWeight: 700,
              color: "#ffffff",
              backgroundColor: isSubmitting
                ? "var(--color-bg-card)"
                : gradeColor,
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              transition: "all 0.2s ease",
              boxShadow: `0 4px 20px ${gradeColor}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isSubmitting ? (
              <>
                <span
                  className="animate-spin"
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                  }}
                />
                Saving…
              </>
            ) : (
              <>
                <span>⚡</span>
                Submit Focus Score — {popup.score}
              </>
            )}
          </button>

          {/* Mandatory notice */}
          <p
            className="text-center mt-2"
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-hint)",
            }}
          >
            Focus tracking is required when CDF is enabled
          </p>
        </div>
      </div>

      {/* ── Slider thumb global styles ────────────────────────────────── */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width:        22px;
          height:       22px;
          border-radius:50%;
          background:   var(--thumb-color, #1565A8);
          border:       3px solid white;
          box-shadow:   0 2px 8px rgba(0,0,0,0.4);
          cursor:       pointer;
          transition:   background 0.2s ease, transform 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width:        22px;
          height:       22px;
          border-radius:50%;
          background:   var(--thumb-color, #1565A8);
          border:       3px solid white;
          box-shadow:   0 2px 8px rgba(0,0,0,0.4);
          cursor:       pointer;
        }
      `}</style>
    </>
  );
}

// hooks/useFocusPopup.ts
// "use client";

// import { useState, useCallback, useRef } from "react";
// import { useAuth } from "@/hooks/useAuth";
// import type { FocusPopupState, CdfEventDTO } from "@/types/cdf";

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface UseFocusPopupReturn {
//   popup: FocusPopupState;
//   isSubmitting: boolean;
//   openPopup: (eventId: string, taskTitle: string) => void;
//   closePopup: () => void;
//   setScore: (score: number) => void;
//   submitScore: () => Promise<void>;
// }

// // ─── Default state ────────────────────────────────────────────────────────────
// const DEFAULT_POPUP: FocusPopupState = {
//   isOpen: false,
//   eventId: null,
//   taskTitle: "",
//   score: 50,
// };

// // ─── Hook ─────────────────────────────────────────────────────────────────────
// export function FocusPopup(
//   onSuccess?: (event: CdfEventDTO) => void,
// ): UseFocusPopupReturn {
//   const { getAccessToken } = useAuth();
//   const [popup, setPopup] = useState<FocusPopupState>(DEFAULT_POPUP);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // ── Ref for latest onSuccess — avoids stale closure ───────────────────────
//   const onSuccessRef = useRef(onSuccess);
//   onSuccessRef.current = onSuccess;

//   // ── Ref for latest popup state — avoids stale closure in submitScore ───────
//   const popupRef = useRef(popup);
//   popupRef.current = popup;

//   // ── Open popup ─────────────────────────────────────────────────────────────
//   const openPopup = useCallback((eventId: string, taskTitle: string) => {
//     setPopup({
//       isOpen: true,
//       eventId,
//       taskTitle,
//       score: 50,
//     });
//   }, []);

//   // ── Close popup ────────────────────────────────────────────────────────────
//   const closePopup = useCallback(() => {
//     setPopup(DEFAULT_POPUP);
//   }, []);

//   // ── Update slider score ────────────────────────────────────────────────────
//   const setScore = useCallback((score: number) => {
//     setPopup((prev) => ({ ...prev, score: Math.round(score) }));
//   }, []);

//   // ── Submit focus score ─────────────────────────────────────────────────────
//   const submitScore = useCallback(async (): Promise<void> => {
//     // Read from ref — always latest values, no stale closure
//     const { eventId, score } = popupRef.current;

//     if (!eventId) return;
//     if (isSubmitting) return;

//     setIsSubmitting(true);

//     try {
//       const token = await getAccessToken();
//       if (!token) {
//         setIsSubmitting(false);
//         return;
//       }

//       const res = await fetch(`/api/cdf/events/${eventId}/focus`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ focusScore: score }),
//       });

//       const data = await res.json().catch(() => null);

//       if (res.ok && data?.data) {
//         // Call onSuccess with latest ref — no stale closure
//         onSuccessRef.current?.(data.data as CdfEventDTO);
//       } else {
//         console.error("[useFocusPopup] API error:", data?.error);
//       }
//     } catch (err) {
//       console.error("[useFocusPopup] submit error:", err);
//     } finally {
//       setIsSubmitting(false);
//       setPopup(DEFAULT_POPUP); // close popup after submit
//     }
//   }, [isSubmitting, getAccessToken]);

//   return {
//     popup,
//     isSubmitting,
//     openPopup,
//     closePopup,
//     setScore,
//     submitScore,
//   };
// }
