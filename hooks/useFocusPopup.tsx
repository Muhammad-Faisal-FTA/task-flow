// // hooks/useFocusPopup.ts
// "use client";

// import {
//   useState,
//   useCallback,
// } from "react";
// import { useAuth } from "@/hooks/useAuth";
// import type { FocusPopupState, CdfEventDTO } from "@/types/cdf";

// interface UseFocusPopupReturn {
//   popup:       FocusPopupState;
//   isSubmitting:boolean;
//   openPopup:   (eventId: string, taskTitle: string) => void;
//   closePopup:  () => void;
//   setScore:    (score: number) => void;
//   submitScore: () => Promise<void>;
// }

// const DEFAULT_POPUP: FocusPopupState = {
//   isOpen:    false,
//   eventId:   null,
//   taskTitle: "",
//   score:     50,             // default slider position
// };

// export function useFocusPopup(
//   onSuccess?: (event: CdfEventDTO) => void
// ): UseFocusPopupReturn {
//   const { getAccessToken } = useAuth();
//   const [popup,        setPopup]        = useState<FocusPopupState>(DEFAULT_POPUP);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // ── Open popup ─────────────────────────────────────────────────────────────
//   const openPopup = useCallback((
//     eventId:   string,
//     taskTitle: string
//   ) => {
//     setPopup({
//       isOpen:    true,
//       eventId,
//       taskTitle,
//       score:     50,
//     });
//   }, []);

//   // ── Close popup — NOT allowed when CDF is on (focus is mandatory) ──────────
//   // This is intentionally not exposed publicly when CDF is enabled
//   const closePopup = useCallback(() => {
//     setPopup(DEFAULT_POPUP);
//   }, []);

//   // ── Update slider value ────────────────────────────────────────────────────
//   const setScore = useCallback((score: number) => {
//     setPopup(prev => ({ ...prev, score: Math.round(score) }));
//   }, []);

//   // ── Submit focus score ─────────────────────────────────────────────────────
//   const submitScore = useCallback(async () => {
//     if (!popup.eventId || isSubmitting) return;

//     setIsSubmitting(true);
//     try {
//       const token = await getAccessToken();
//       if (!token) return;

//       const res = await fetch(
//         `/api/cdf/events/${popup.eventId}/focus`,
//         {
//           method:  "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization:  `Bearer ${token}`,
//           },
//           body: JSON.stringify({ focusScore: popup.score }),
//         }
//       );

//       if (res.ok) {
//         const data = await res.json();
//         onSuccess?.(data.data as CdfEventDTO);
//       }

//       // Close after submit — success or fail
//       setPopup(DEFAULT_POPUP);
//     } catch (err) {
//       console.error("[useFocusPopup] submit error:", err);
//       setPopup(DEFAULT_POPUP);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [popup.eventId, popup.score, isSubmitting, getAccessToken, onSuccess]);

//   return {
//     popup,
//     isSubmitting,
//     openPopup,
//     closePopup,
//     setScore,
//     submitScore,
//   };
// }


// hooks/useFocusPopup.ts
"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth }                        from "@/hooks/useAuth";
import type { FocusPopupState, CdfEventDTO } from "@/types/cdf";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseFocusPopupReturn {
  popup:        FocusPopupState;
  isSubmitting: boolean;
  openPopup:    (eventId: string, taskTitle: string) => void;
  closePopup:   () => void;
  setScore:     (score: number) => void;
  submitScore:  () => Promise<void>;
}

const DEFAULT_POPUP: FocusPopupState = {
  isOpen:    false,
  eventId:   null,
  taskTitle: "",
  score:     50,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFocusPopup(
  onSuccess?: (event: CdfEventDTO) => void
): UseFocusPopupReturn {
  const { getAccessToken }              = useAuth();
  const [popup,        setPopup]        = useState<FocusPopupState>(DEFAULT_POPUP);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs — always hold latest values without stale closure
  const onSuccessRef   = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  // Separate refs for eventId and score — updated on every change
  const eventIdRef = useRef<string | null>(null);
  const scoreRef   = useRef<number>(50);

  // ── Open popup ─────────────────────────────────────────────────────────────
  const openPopup = useCallback((eventId: string, taskTitle: string) => {
    // Update refs immediately — before state update
    eventIdRef.current = eventId;
    scoreRef.current   = 50;

    setPopup({
      isOpen:    true,
      eventId,
      taskTitle,
      score:     50,
    });
  }, []);

  // ── Close popup ────────────────────────────────────────────────────────────
  const closePopup = useCallback(() => {
    eventIdRef.current = null;
    scoreRef.current   = 50;
    setPopup(DEFAULT_POPUP);
  }, []);

  // ── Update slider — updates BOTH state and ref ─────────────────────────────
  const setScore = useCallback((score: number) => {
    const rounded      = Math.round(score);
    scoreRef.current   = rounded;           // ← ref updated immediately
    setPopup(prev => ({ ...prev, score: rounded }));
  }, []);

  // ── Submit — reads from refs, never from stale state ──────────────────────
  const submitScore = useCallback(async (): Promise<void> => {
    const eventId = eventIdRef.current;
    const score   = scoreRef.current;

    // Guards
    if (!eventId) {
      console.error("[useFocusPopup] No eventId — cannot submit");
      return;
    }
    if (isSubmitting) return;

    console.log(`[useFocusPopup] Submitting focus score ${score} for event ${eventId}`);

    setIsSubmitting(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        console.error("[useFocusPopup] No auth token");
        return;
      }

      const res = await fetch(`/api/cdf/events/${eventId}/focus`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ focusScore: score }),
      });

      const data = await res.json().catch(() => null);

      console.log(`[useFocusPopup] Response:`, res.status, data);

      if (res.ok && data?.data) {
        onSuccessRef.current?.(data.data as CdfEventDTO);
      } else {
        console.error("[useFocusPopup] API error:", data?.error ?? res.status);
      }
    } catch (err) {
      console.error("[useFocusPopup] Network error:", err);
    } finally {
      setIsSubmitting(false);
      // Clear refs + close popup
      eventIdRef.current = null;
      scoreRef.current   = 50;
      setPopup(DEFAULT_POPUP);
    }
  }, [isSubmitting, getAccessToken]);

  return {
    popup,
    isSubmitting,
    openPopup,
    closePopup,
    setScore,
    submitScore,
  };
}