"use client";

import { useEffect, useState } from "react";
import { sharingApi } from "@/services/apiService";
import type { ShareableUser } from "@/types/sharing";

interface TaskFlowShareDialogProps {
  taskId: string;
  open: boolean;
  onClose: () => void;
}

export function TaskFlowShareDialog({ taskId, open, onClose }: TaskFlowShareDialogProps) {
  const [recipients, setRecipients] = useState<ShareableUser[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setIsLoading(true);
    setError(null);
    sharingApi.getEligibleRecipients()
      .then((users) => {
        if (active) setRecipients(users);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load share recipients.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [open]);

  if (!open) return null;

  const handleShare = async () => {
    const recipient = recipients.find((user) => user.id === selectedId);
    if (!recipient) return;
    setIsSending(true);
    setError(null);
    try {
      await sharingApi.shareTask(taskId, recipient.id);
      setSentTo(recipient.name);
      setSelectedId("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send this task.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="taskflow-share-title"
        className="w-full max-w-md rounded-card p-5 shadow-dialog"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border-default)" }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="taskflow-share-title" className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Share with a TaskFlow user
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-hint)" }}>
              They can accept to add an independent copy to their tasks.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close sharing dialog" className="text-sm" style={{ color: "var(--color-text-hint)" }}>
            Close
          </button>
        </div>

        {isLoading ? (
          <p className="py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>Loading allowed recipients…</p>
        ) : recipients.length === 0 ? (
          <p className="py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            No users have allowed you to share with them yet. Update your{" "}
            <a href="/sharing" className="underline" style={{ color: "var(--color-accent)" }}>sharing allow list</a>.
          </p>
        ) : (
          <>
            <label htmlFor="task-share-recipient" className="mb-2 block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Share only with users who have allowed you
            </label>
            <select
              id="task-share-recipient"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="w-full rounded-[8px] px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-bg-app)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-default)" }}
            >
              <option value="">Choose a user</option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>{recipient.name} ({recipient.email})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleShare}
              disabled={!selectedId || isSending}
              className="mt-4 w-full rounded-[8px] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {isSending ? "Sending…" : "Send invitation"}
            </button>
          </>
        )}

        {sentTo && <p className="mt-3 text-sm" role="status" style={{ color: "var(--color-success)" }}>Invitation sent to {sentTo}.</p>}
        {error && <p className="mt-3 text-sm" role="alert" style={{ color: "var(--color-overdue)" }}>{error}</p>}
      </section>
    </div>
  );
}
