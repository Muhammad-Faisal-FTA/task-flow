// hooks/useVoiceInput.ts
// Web Speech API hook — FR-03 + FR-13
"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

interface UseVoiceInputOptions {
  // Called when speech is recognised — use to fill input
  onResult:  (transcript: string) => void;
  onError?:  (message: string)    => void;
  language?: string;               // default: "en-US"
}

interface UseVoiceInputReturn {
  state:       VoiceState;
  isListening: boolean;
  isSupported: boolean;
  start:       () => void;
  stop:        () => void;
  toggle:      () => void;
}

// ─── Browser SpeechRecognition type shim ──────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous:         boolean;
  interimResults:     boolean;
  lang:               string;
  maxAlternatives:    number;
  start:              () => void;
  stop:               () => void;
  abort:              () => void;
  onresult:           ((e: SpeechRecognitionEvent) => void) | null;
  onerror:            ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend:              (() => void) | null;
  onstart:            (() => void) | null;
}

// ─── Get SpeechRecognition constructor safely ─────────────────────────────────
function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ??
    (window as any).webkitSpeechRecognition ??
    null
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVoiceInput({
  onResult,
  onError,
  language = "en-US",
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const recognitionRef    = useRef<SpeechRecognitionInstance | null>(null);
  const isSupported       = getSpeechRecognition() !== null;

  // ── Initialise recognition instance ──────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setState("unsupported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous      = false;   // Stop after first result
    recognition.interimResults  = false;   // Final results only
    recognition.lang            = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      setState("processing");
      const transcript = e.results[0]?.[0]?.transcript?.trim() ?? "";
      if (transcript) {
        onResult(transcript);
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error("[Voice] Recognition error:", e.error);

      const errorMessages: Record<string, string> = {
        "not-allowed":      "Microphone access denied. Please allow microphone permissions.",
        "no-speech":        "No speech detected. Please try again.",
        "network":          "Network error. Please check your connection.",
        "audio-capture":    "No microphone found.",
        "service-not-allowed": "Speech recognition not allowed.",
        "aborted":          "",   // User stopped — not an error
      };

      const message = errorMessages[e.error] ?? "Voice input failed. Please try again.";
      if (message) onError?.(message);

      setState("error");
      setTimeout(() => setState("idle"), 2000);
    };

    recognition.onend = () => {
      // Only reset to idle if not already in error state
      setState((prev) => (prev === "error" ? prev : "idle"));
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [language, onResult, onError]);

  // ── Start listening ───────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    if (state === "listening") return;

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("[Voice] Failed to start:", err);
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }, [state]);

  // ── Stop listening ────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setState("idle");
  }, []);

  // ── Toggle ────────────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    if (state === "listening") {
      stop();
    } else {
      start();
    }
  }, [state, start, stop]);

  return {
    state,
    isListening: state === "listening",
    isSupported,
    start,
    stop,
    toggle,
  };
}