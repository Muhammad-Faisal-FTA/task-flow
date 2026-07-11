// services/notificationService.ts
import mongoose           from "mongoose";
// import * as webpush        from "web-push";
import { connectDB }      from "@/lib/mongoose";
import { TaskModel }      from "@/models/task.model";
// import "@/models/pushSubscription.model";
import { PushPayload, PushSubscriptionData } from "@/lib/webpush";

const PushSubscriptionModel = mongoose.models.PushSubscription as mongoose.Model<any>;

type PushNotificationResult =
  | { success: true }
  | { success: false; error: "SUBSCRIPTION_EXPIRED" | "SEND_ERROR" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

// ─── Save subscription ────────────────────────────────────────────────────────
export async function saveSubscription(
  userId:       string,
  subscription: PushSubscriptionData,
  userAgent?:   string
): Promise<void> {
  await connectDB();

  await PushSubscriptionModel.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      $set: {
        userId:    toObjectId(userId),
        endpoint:  subscription.endpoint,
        keys:      subscription.keys,
        userAgent: userAgent ?? null,
      },
    },
    { upsert: true, new: true }
  );
}

// ─── Remove subscription ──────────────────────────────────────────────────────
export async function removeSubscription(
  userId:   string,
  endpoint: string
): Promise<void> {
  await connectDB();
  await PushSubscriptionModel.deleteOne({
    userId:   toObjectId(userId),
    endpoint,
  });
}

// ─── Remove expired subscription ─────────────────────────────────────────────
async function removeExpiredSubscription(endpoint: string): Promise<void> {
  await PushSubscriptionModel.deleteOne({ endpoint });
  console.log(`[Notifications] Removed expired subscription: ${endpoint}`);
}

// ─── Send at-time reminders ───────────────────────────────────────────────────
// Called by cron every minute (or whatever interval you configure)
// Finds tasks due within the next [windowMinutes] minutes and sends pushes
export async function sendAtTimeReminders(
  windowMinutes = 5
): Promise<{ sent: number; failed: number; skipped: number }> {
  await connectDB();

  const now     = new Date();
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

  // Build today's date string "YYYY-MM-DD"
  const todayStr = now.toISOString().split("T")[0];

  // Find all active tasks with dueDate=today, dueTime set, not completed
  const tasks = await TaskModel
    .find({
      dueDate:   {
        $gte: new Date(todayStr + "T00:00:00.000Z"),
        $lt:  new Date(todayStr + "T23:59:59.999Z"),
      },
      dueTime:   { $ne: null },
      completed: false,
      deletedAt: null,
    })
    .lean();

  let sent = 0, failed = 0, skipped = 0;

  for (const task of tasks) {
    // Parse task due datetime in local terms using dueTime "HH:MM"
    const [hours, minutes] = (task.dueTime as string).split(":").map(Number);
    const taskDueAt = new Date(todayStr);
    taskDueAt.setHours(hours, minutes, 0, 0);

    // Check if task is due within window
    if (taskDueAt < now || taskDueAt > windowEnd) {
      skipped++;
      continue;
    }

    // Get all push subscriptions for this user
    const subscriptions = await PushSubscriptionModel
      .find({ userId: task.userId })
      .lean();

    if (subscriptions.length === 0) {
      skipped++;
      continue;
    }

    // Build notification payload
    const payload: PushPayload = {
      title:  "⏰ Task Due Now",
      body:   task.title,
      icon:   "/icons/icon-192x192.png",
      badge:  "/icons/icon-72x72.png",
      url:    "/",
      taskId: task._id.toString(),
    };

    // Send to all devices for this user
    for (const sub of subscriptions) {
      const subData: PushSubscriptionData = {
        endpoint: sub.endpoint,
        keys:     sub.keys,
      };

      const result = await sendPushNotification(subData, payload);

      if (result.success) {
        sent++;
      } else if (result.error === "SUBSCRIPTION_EXPIRED") {
        await removeExpiredSubscription(sub.endpoint);
        skipped++;
      } else {
        failed++;
      }
    }
  }

  console.log(`[Notifications] Sent: ${sent} Failed: ${failed} Skipped: ${skipped}`);
  return { sent, failed, skipped };
}

async function sendPushNotification(
  subData: PushSubscriptionData,
  payload: PushPayload
): Promise<PushNotificationResult> {
  try {
    // await webpush.sendNotification(subData as any, JSON.stringify(payload));
    return { success: true };
  } catch (error: any) {
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      return { success: false, error: "SUBSCRIPTION_EXPIRED" };
    }

    console.error("[Notifications] Push send failed", error);
    return { success: false, error: "SEND_ERROR" };
  }
}
