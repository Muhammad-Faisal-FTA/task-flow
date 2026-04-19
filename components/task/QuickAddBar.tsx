// components/task/QuickAddBar.tsx
"use client";

import {
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Mic, MicOff, Plus, Loader2 } from "lucide-react";
import { useQuickAdd }   from "@/hooks/useQuickAdd";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import type { TaskDTO }  from "@/types/task";

interface QuickAddBarProps {
  open:           boolean;
  onTaskCreated?: (task: TaskDTO) => void;
  onError?:       (message: string) => void;
  onClose?:       () => void;
}

export function QuickAddBar({
  open,
  onTaskCreated,
  onError,
  onClose,
}: QuickAddBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    value,
    setValue,
    isSubmitting,
    isLoading,
    submit,
    defaultList,
  } = useQuickAdd({
    onSuccess: onTaskCreated,
    onError,
  });

  const {
    state:       voiceState,
    isListening,
    isSupported: isVoiceSupported,
    toggle:      toggleVoice,
  } = useVoiceInput({
    onResult: useCallback((transcript: string) => {
      setValue(transcript);
      inputRef.current?.focus();
    }, [setValue]),
    onError,
    language: "en-US",
  });

  // Auto focus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
      if (e.key === "Escape") onClose?.();
    },
    [submit, onClose]
  );

  const voiceLabel =
    voiceState === "listening"  ? "Listening…"  :
    voiceState === "processing" ? "Processing…" :
    voiceState === "error"      ? "Try again"   :
    null;

  const placeholder =
    isLoading   ? "Loading…"                      :
    isListening ? "Speak now…"                    :
    defaultList ? `Add to ${defaultList.name}…`   :
    "Enter a task…";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:      "fixed",
          inset:         0,
          zIndex:        45,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity:       open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition:    "opacity 0.25s ease",
        }}
      />

      {/* Slide-up panel — sits ABOVE backdrop, BELOW nav */}
      <div
        style={{
          position:        "fixed",
          left:            0,
          right:           0,
          // Sits just above the bottom nav (bottom nav ~72px tall)
          bottom:          "72px",
          zIndex:          55,
          maxWidth:        "430px",
          margin:          "0 auto",
          transform:       open ? "translateY(0)" : "translateY(110%)",
          transition:      "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          backgroundColor: "var(--color-bg-header)",
          borderTop:       "1px solid var(--color-border-default)",
          borderRadius:    "20px 20px 0 0",
          boxShadow:       "0 -8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "var(--color-border-default)" }}
          />
        </div>

        {/* Title */}
        <p
          className="text-center font-semibold tracking-widest uppercase pb-3 px-4"
          style={{
            fontSize: "var(--text-xs)",
            color:    "var(--color-text-accent)",
          }}
        >
          Quick Add Task
        </p>

        {/* Voice banner */}
        {voiceLabel && (
          <div
            className="flex items-center justify-center gap-2 py-2 mx-4 rounded-card mb-3"
            style={{
              fontSize:        "var(--text-sm)",
              backgroundColor: "var(--color-bg-card)",
              color: voiceState === "error"
                ? "var(--color-overdue)"
                : "var(--color-accent)",
            }}
          >
            {voiceState === "listening" && (
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--color-overdue)" }}
              />
            )}
            {voiceLabel}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-center gap-2 px-4 pb-3">

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSubmitting || isLoading || !open}
              maxLength={255}
              className="auth-input w-full"
              style={{
                paddingTop:    "11px",
                paddingBottom: "11px",
                fontSize:      "var(--text-base)",
                paddingRight:  value.length > 200 ? "44px" : "14px",
              }}
              aria-label="Quick add task"
            />
            {value.length > 200 && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{
                  fontSize: "var(--text-xs)",
                  color: value.length > 240
                    ? "var(--color-overdue)"
                    : "var(--color-text-hint)",
                }}
              >
                {255 - value.length}
              </span>
            )}
          </div>

          {/* Voice button */}
          {isVoiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={isSubmitting}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              className="flex-shrink-0 active:scale-90 transition-transform"
              style={{
                width:           "44px",
                height:          "44px",
                borderRadius:    "var(--radius-input)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                backgroundColor: isListening
                  ? "rgba(229,57,53,0.15)"
                  : "var(--color-bg-card)",
                border: `1.5px solid ${isListening
                  ? "var(--color-overdue)"
                  : "var(--color-border-default)"}`,
                color: isListening
                  ? "var(--color-overdue)"
                  : "var(--color-text-hint)",
              }}
            >
              {isListening
                ? <MicOff className="w-[18px] h-[18px]" />
                : <Mic    className="w-[18px] h-[18px]" />
              }
            </button>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || isSubmitting || isLoading}
            aria-label="Add task"
            className="flex-shrink-0 active:scale-90 transition-transform"
            style={{
              width:           "44px",
              height:          "44px",
              borderRadius:    "var(--radius-input)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              backgroundColor: value.trim() && !isSubmitting
                ? "var(--color-primary)"
                : "var(--color-bg-card)",
              border:   "1.5px solid var(--color-border-default)",
              color:    value.trim() && !isSubmitting
                ? "#ffffff"
                : "var(--color-text-hint)",
              opacity:  !value.trim() || isSubmitting ? 0.5 : 1,
              transition: "background-color 0.2s, opacity 0.2s",
            }}
          >
            {isSubmitting
              ? <Loader2 className="w-[18px] h-[18px] animate-spin" />
              : <Plus    className="w-[18px] h-[18px]" />
            }
          </button>
        </div>

        {/* Default list indicator */}
        {defaultList && (
          <div
            className="flex items-center gap-2 px-4 pb-4"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: defaultList.color ?? "var(--color-primary)" }}
            />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-hint)" }}>
              Adding to{" "}
              <strong style={{ color: "var(--color-text-secondary)" }}>
                {defaultList.name}
              </strong>
            </span>
          </div>
        )}
      </div>
    </>
  );
}