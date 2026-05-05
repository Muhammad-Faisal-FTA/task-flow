// hooks/useFocusPopup.ts
"use client";

import {
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import type { FocusPopupState, CdfEventDTO } from "@/types/cdf";

interface UseFocusPopupReturn {
  popup:       FocusPopupState;
  isSubmitting:boolean;
  openPopup:   (eventId: string, taskTitle: string) => void;
  closePopup:  () => void;
  setScore:    (score: number) => void;
  submitScore: () => Promise<void>;
}

const DEFAULT_POPUP: FocusPopupState = {
  isOpen:    false,
  eventId:   null,
  taskTitle: "",
  score:     50,             // default slider position
};

export function useFocusPopup(
  onSuccess?: (event: CdfEventDTO) => void
): UseFocusPopupReturn {
  const { getAccessToken } = useAuth();
  const [popup,        setPopup]        = useState<FocusPopupState>(DEFAULT_POPUP);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Open popup ─────────────────────────────────────────────────────────────
  const openPopup = useCallback((
    eventId:   string,
    taskTitle: string
  ) => {
    setPopup({
      isOpen:    true,
      eventId,
      taskTitle,
      score:     50,
    });
  }, []);

  // ── Close popup — NOT allowed when CDF is on (focus is mandatory) ──────────
  // This is intentionally not exposed publicly when CDF is enabled
  const closePopup = useCallback(() => {
    setPopup(DEFAULT_POPUP);
  }, []);

  // ── Update slider value ────────────────────────────────────────────────────
  const setScore = useCallback((score: number) => {
    setPopup(prev => ({ ...prev, score: Math.round(score) }));
  }, []);

  // ── Submit focus score ─────────────────────────────────────────────────────
  const submitScore = useCallback(async () => {
    if (!popup.eventId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch(
        `/api/cdf/events/${popup.eventId}/focus`,
        {
          method:  "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ focusScore: popup.score }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        onSuccess?.(data.data as CdfEventDTO);
      }

      // Close after submit — success or fail
      setPopup(DEFAULT_POPUP);
    } catch (err) {
      console.error("[useFocusPopup] submit error:", err);
      setPopup(DEFAULT_POPUP);
    } finally {
      setIsSubmitting(false);
    }
  }, [popup.eventId, popup.score, isSubmitting, getAccessToken, onSuccess]);

  return {
    popup,
    isSubmitting,
    openPopup,
    closePopup,
    setScore,
    submitScore,
  };
}
