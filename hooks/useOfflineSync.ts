// hooks/useOfflineSync.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface UseOfflineSyncReturn {
  isOnline:    boolean;
  isSyncing:   boolean;
  pendingCount: number;
}

export function useOfflineSync(
  onSyncComplete?: () => void
): UseOfflineSyncReturn {
  const [isOnline,     setIsOnline]     = useState(true);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // ── Count pending queue items ─────────────────────────────────────────────
  const countPending = useCallback(async () => {
    try {
      const request = indexedDB.open("taskflow-queue", 1);
      request.onsuccess = e => {
        const db  = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("pending-requests")) return;
        const tx  = db.transaction("pending-requests", "readonly");
        const cnt = tx.objectStore("pending-requests").count();
        cnt.onsuccess = () => setPendingCount(cnt.result);
      };
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    countPending();

    // Online handler — tell SW to flush queue
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);

      // Tell service worker to flush queue
      navigator.serviceWorker?.controller?.postMessage({ type: "ONLINE" });

      // Fallback timeout if SW doesn't respond
      setTimeout(() => setIsSyncing(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // SW message handler — sync complete
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        setIsSyncing(false);
        setPendingCount(0);
        onSyncComplete?.();
      }
    };

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
    };
  }, [countPending, onSyncComplete]);

  useEffect(() => {
    // Initialize online state
    setIsOnline(navigator.onLine);
  }, []);

  return { isOnline, isSyncing, pendingCount };
}