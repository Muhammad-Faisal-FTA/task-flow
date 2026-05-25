// hooks/usePushNotifications.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth }                           from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────
type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface UsePushNotificationsReturn {
  permission:   PermissionState;
  isSubscribed: boolean;
  isLoading:    boolean;
  subscribe:    () => Promise<void>;
  unsubscribe:  () => Promise<void>;
}

// ─── Helper: convert base64 VAPID key ────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding  = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData  = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePushNotifications(): UsePushNotificationsReturn {
  const { getAccessToken }              = useAuth();
  const [permission,   setPermission]   = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  // ── Check initial state ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready.then(async reg => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    }).catch(() => {});
  }, []);

  // ── Subscribe ──────────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result !== "granted") {
        setIsLoading(false);
        return;
      }

      // 2. Get SW registration
      const reg = await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID public key not set");

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        // TS expects a BufferSource (ArrayBuffer or ArrayBufferView with ArrayBuffer
        // backing it). Cast to unknown then to BufferSource to satisfy strict libs
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });

      // 4. Send subscription to server
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const subJson = subscription.toJSON() as {
        endpoint: string;
        keys:     { p256dh: string; auth: string };
      };

      const res = await fetch("/api/notifications/subscribe", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys:     subJson.keys,
        }),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setIsSubscribed(true);
    } catch (err) {
      console.error("[usePushNotifications] subscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, getAccessToken]);

  // ── Unsubscribe ────────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // Remove from server first
        const token = await getAccessToken();
        if (token) {
          await fetch("/api/notifications/subscribe", {
            method:  "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization:  `Bearer ${token}`,
            },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }

        // Unsubscribe from browser
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("[usePushNotifications] unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, getAccessToken]);

  return {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}