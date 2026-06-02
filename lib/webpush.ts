// lib/webpush.ts
import * as webpush from "web-push";

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

  const subject    = process.env.VAPID_SUBJECT;
  const publicKey  = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "[webpush] Missing VAPID environment variables. " +
      "Run: npx web-push generate-vapid-keys"
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
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