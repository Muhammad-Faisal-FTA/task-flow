"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sharingApi } from "@/services/apiService";
import type { ShareAllowListUser, TaskShareInvitation } from "@/types/sharing";

export default function SharingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<ShareAllowListUser[]>([]);
  const [invitations, setInvitations] = useState<TaskShareInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeInvitation, setActiveInvitation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSharingData = useCallback(async () => {
    setError(null);
    try {
      const [allowList, pendingInvitations] = await Promise.all([
        sharingApi.getAllowList(),
        sharingApi.getInvitations(),
      ]);
      setUsers(allowList);
      setInvitations(pendingInvitations);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load sharing settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.push("/login");
    if (isAuthenticated) void loadSharingData();
  }, [isAuthenticated, isAuthLoading, loadSharingData, router]);

  const toggleAllowedUser = (userId: string) => {
    setUsers((current) => current.map((user) => (
      user.id === userId ? { ...user, allowed: !user.allowed } : user
    )));
    setMessage(null);
  };

  const saveAllowList = async () => {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await sharingApi.updateAllowList(users.filter((user) => user.allowed).map((user) => user.id));
      setUsers(updated);
      setMessage("Sharing permissions saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save sharing permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const respondToInvitation = async (shareId: string, action: "accept" | "decline") => {
    setActiveInvitation(shareId);
    setError(null);
    setMessage(null);
    try {
      await sharingApi.respondToInvitation(shareId, action);
      await loadSharingData();
      setMessage(action === "accept" ? "Task copied to your tasks." : "Invitation declined.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not respond to the invitation.");
    } finally {
      setActiveInvitation(null);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--color-bg-app)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--color-primary)" }} />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--color-bg-app)" }}>
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => router.push("/settings")} className="mb-5 inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeft size={16} /> Settings
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Task sharing</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-hint)" }}>
          Add users who may send you task invitations. Your tasks are never shared without your acceptance.
        </p>

        {error && <p className="mt-4 rounded-[8px] p-3 text-sm" role="alert" style={{ color: "var(--color-overdue)", backgroundColor: "var(--color-bg-card)" }}>{error}</p>}
        {message && <p className="mt-4 rounded-[8px] p-3 text-sm" role="status" style={{ color: "var(--color-success)", backgroundColor: "var(--color-bg-card)" }}>{message}</p>}

        <section className="mt-6 rounded-card p-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border-default)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Users allowed to share with you</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-hint)" }}>
            Only users checked here will appear as recipients to share with you.
          </p>
          {users.length === 0 ? (
            <p className="py-5 text-sm" style={{ color: "var(--color-text-secondary)" }}>No other verified TaskFlow users are registered yet.</p>
          ) : (
            <ul className="mt-4 divide-y" style={{ borderColor: "var(--color-border-default)" }}>
              {users.map((user) => (
                <li key={user.id} className="flex items-center gap-3 py-3">
                  <input
                    id={`allow-${user.id}`}
                    type="checkbox"
                    checked={user.allowed}
                    onChange={() => toggleAllowedUser(user.id)}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <label htmlFor={`allow-${user.id}`} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{user.name}</span>
                    <span className="block truncate text-xs" style={{ color: "var(--color-text-hint)" }}>{user.email}</span>
                  </label>
                  {user.allowed && <Check size={16} aria-label="Allowed" style={{ color: "var(--color-success)" }} />}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={saveAllowList}
            disabled={isSaving}
            className="mt-4 inline-flex items-center gap-2 rounded-[8px] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <ArrowDownToLine size={16} /> {isSaving ? "Saving…" : "Save permissions"}
          </button>
        </section>

        <section className="mt-6 rounded-card p-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border-default)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Incoming task invitations</h2>
          {invitations.length === 0 ? (
            <p className="py-5 text-sm" style={{ color: "var(--color-text-secondary)" }}>No pending invitations.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="rounded-[8px] p-3" style={{ backgroundColor: "var(--color-bg-app)" }}>
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{invitation.snapshot.title}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-hint)" }}>
                    From {invitation.senderName} · {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void respondToInvitation(invitation.id, "accept")}
                      disabled={activeInvitation !== null}
                      className="inline-flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      <Check size={14} /> Accept copy
                    </button>
                    <button
                      type="button"
                      onClick={() => void respondToInvitation(invitation.id, "decline")}
                      disabled={activeInvitation !== null}
                      className="inline-flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-sm"
                      style={{ color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
