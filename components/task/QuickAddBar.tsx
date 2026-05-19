

// components/task/QuickAddBar.tsx
"use client";

import { useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Plus, Loader2, X } from "lucide-react";
import { useQuickAdd } from "@/hooks/useQuickAdd";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import type { TaskDTO } from "@/types/task";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuickAddBarProps {
  open: boolean;
  onTaskCreated?: (task: TaskDTO) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function QuickAddBar({
  open,
  onTaskCreated,
  onError,
  onClose,
}: QuickAddBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { value, setValue, isSubmitting, isLoading, submit, defaultList } =
    useQuickAdd({
      onSuccess: onTaskCreated,
      onError,
    });

  const {
    state: voiceState,
    isListening,
    isSupported: isVoiceSupported,
    toggle: toggleVoice,
  } = useVoiceInput({
    onResult: useCallback(
      (transcript: string) => {
        setValue(transcript);
        inputRef.current?.focus();
      },
      [setValue],
    ),
    onError,
    language: "en-US",
  });

  // Auto-focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
      if (e.key === "Escape") onClose?.();
    },
    [submit, onClose],
  );

  const voiceLabel =
    voiceState === "listening"
      ? "Listening…"
      : voiceState === "processing"
        ? "Processing…"
        : voiceState === "error"
          ? "Try again"
          : null;

  const placeholder = isLoading
    ? "Loading…"
    : isListening
      ? "Speak now…"
      : defaultList
        ? `Add to ${defaultList.name}…`
        : "Enter a task…";

  // ── Don't render anything when closed ────────────────────────────────────
  if (!open) return null;

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* ── Panel ─────────────────────────────────────────────────────── */}
      {/*                                                                  */}
      {/* MOBILE  (< 768px): slides up from bottom, full width            */}
      {/* DESKTOP (≥ 768px): centered modal, fixed width 480px            */}
      {/*                                                                  */}
      {/* Using a single element with Tailwind responsive classes so both */}
      {/* layouts share the same markup — no JS viewport detection needed */}
      <div
        className={[
          // ── Shared ────────────────────────────────────────────────────
          "fixed z-[101]",
          "w-full",

          // ── Mobile: bottom sheet ──────────────────────────────────────
          "bottom-0 left-0 right-0",
          "rounded-t-[20px]",

          // ── Desktop: centered modal ───────────────────────────────────
          "md:bottom-auto md:top-1/2 md:left-1/2",
          "md:-translate-x-1/2 md:-translate-y-1/2",
          "md:max-w-[480px]",
          "md:rounded-card",
        ].join(" ")}
        style={{
          backgroundColor: "var(--color-bg-header)",
          border: "1px solid var(--color-border-default)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        {/* ── Drag handle (mobile only) ──────────────────────────────── */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "var(--color-border-default)",
            }}
          />
        </div>

        {/* ── Header row ────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--color-border-default)" }}
        >
          <p
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--color-text-accent)",
            }}
          >
            Quick Add Task
          </p>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] active:scale-90 transition-transform"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-hint)",
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            <X style={{ width: "14px", height: "14px" }} />
          </button>
        </div>

        {/* ── Voice banner ──────────────────────────────────────────────── */}
        {voiceLabel && (
          <div
            className="flex items-center justify-center gap-2 mx-4 mt-3 rounded-card"
            style={{
              padding: "8px",
              fontSize: "var(--text-sm)",
              backgroundColor: "var(--color-bg-card)",
              color:
                voiceState === "error"
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

        {/* ── Input + action buttons ────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-4">
          {/* Text input */}
          <div className="flex-1 relative min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSubmitting || isLoading}
              maxLength={255}
              className="auth-input w-full"
              style={{
                paddingTop: "11px",
                paddingBottom: "11px",
                fontSize: "var(--text-base)",
                paddingRight: value.length > 200 ? "44px" : "14px",
              }}
              aria-label="Task name"
            />
            {/* Char counter */}
            {value.length > 200 && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{
                  fontSize: "var(--text-xs)",
                  color:
                    value.length > 240
                      ? "var(--color-overdue)"
                      : "var(--color-text-hint)",
                  pointerEvents: "none",
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
              aria-label={isListening ? "Stop voice" : "Start voice"}
              className="flex-shrink-0 active:scale-90 transition-transform"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-input)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isListening
                  ? "rgba(229,57,53,0.15)"
                  : "var(--color-bg-card)",
                border: `1.5px solid ${
                  isListening
                    ? "var(--color-overdue)"
                    : "var(--color-border-default)"
                }`,
                color: isListening
                  ? "var(--color-overdue)"
                  : "var(--color-text-hint)",
                cursor: "pointer",
              }}
            >
              {isListening ? (
                <MicOff className="w-[18px] h-[18px]" />
              ) : (
                <Mic className="w-[18px] h-[18px]" />
              )}
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
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-input)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                value.trim() && !isSubmitting
                  ? "var(--color-primary)"
                  : "var(--color-bg-card)",
              border: "1.5px solid var(--color-border-default)",
              color:
                value.trim() && !isSubmitting
                  ? "#ffffff"
                  : "var(--color-text-hint)",
              opacity: !value.trim() || isSubmitting ? 0.5 : 1,
              cursor: !value.trim() || isSubmitting ? "not-allowed" : "pointer",
              transition: "background-color 0.2s, opacity 0.2s",
            }}
          >
            {isSubmitting ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <Plus className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>

        {/* ── Default list indicator ────────────────────────────────────── */}
        {defaultList && (
          <div className="flex items-center gap-2 px-4 pb-4">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: defaultList.color ?? "var(--color-primary)",
              }}
            />
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-hint)",
              }}
            >
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
