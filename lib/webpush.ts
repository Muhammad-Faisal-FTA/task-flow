// lib/webpush.ts
import * as webpush from "web-push";

const FALLBACK_VAPID_SUBJECT = "mailto:xelolabsse@gmail.com";
const FALLBACK_VAPID_PUBLIC_KEY = "BPaktu_UhvjXblKXJZYo1Jw5A_Xa1oH8Ug2X3m5bGw0bxMA44Wi7HHlWtHrzXQNLE-WGSL3VjmzZSulUjz53Fnw";
const FALLBACK_VAPID_PRIVATE_KEY = "bcbBEHGK6rEL3Wr5o0YYqCsnZOmnkHbYqwOHmc8jsjw";

export interface PushPayload {
  title:   string;
  body:    string;
  icon?:   string;
  badge?:  string;
  url?:    string;
  taskId?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth:   string;
  };
}

// ─── Lazy init — only configure when actually called ──────────────────────────
// Avoids build-time crash when env vars aren't available during static analysis
let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;

  webpush.setVapidDetails(
    FALLBACK_VAPID_SUBJECT,
    FALLBACK_VAPID_PUBLIC_KEY,
    FALLBACK_VAPID_PRIVATE_KEY,
  );
  initialized = true;
}

// ─── Send push to one subscription ───────────────────────────────────────────
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload:       PushPayload
): Promise<{ success: boolean; error?: string }> {
  ensureInitialized();   // ← called here, not at module load

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL:     60 * 60,
        urgency: "normal",
      }
    );
    return { success: true };
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    console.error("[webpush] Send failed:", e.statusCode, e.message);

    if (e.statusCode === 404 || e.statusCode === 410) {
      return { success: false, error: "SUBSCRIPTION_EXPIRED" };
    }

    return { success: false, error: e.message ?? "UNKNOWN" };
  }
}