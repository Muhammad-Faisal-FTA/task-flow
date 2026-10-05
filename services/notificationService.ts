import { and, eq, gte, isNotNull, isNull, lt, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions, tasks } from "@/db/schema";
import { type PushPayload, type PushSubscriptionData, sendPushNotification } from "@/lib/webpush";
import { isTaskReminderDue } from "@/utils/notificationTiming";

export async function saveSubscription(userId: string, sub: PushSubscriptionData, userAgent?: string): Promise<void> {
  await db.insert(pushSubscriptions).values({ userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent, updatedAt: new Date() } });
}
export async function removeSubscription(userId: string, endpoint: string): Promise<void> { await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint))); }
export async function sendAtTimeReminders() {
  const now = new Date(), day = new Date(now); day.setHours(0, 0, 0, 0); const tomorrow = new Date(day); tomorrow.setDate(day.getDate() + 1);
  const due = await db.select().from(tasks).where(and(gte(tasks.dueDate, day), lt(tasks.dueDate, tomorrow), or(isNotNull(tasks.startTime), isNotNull(tasks.dueTime)), eq(tasks.completed, false), isNull(tasks.deletedAt)));
  let sent = 0, failed = 0, skipped = 0;
  for (const task of due) {
    const startTime = task.startTime ?? task.dueTime;
    if (!task.dueDate || !startTime) continue;
    const [h, m] = startTime.split(":").map(Number), at = new Date(day); at.setHours(h, m);
    if (!isTaskReminderDue(now, at)) { skipped++; continue; }
    const [claimed] = await db.update(tasks)
      .set({ reminderSentFor: task.dueDate })
      .where(and(
        eq(tasks.id, task.id),
        eq(tasks.dueDate, task.dueDate),
        or(isNull(tasks.reminderSentFor), ne(tasks.reminderSentFor, task.dueDate)),
      ))
      .returning({ id: tasks.id });
    if (!claimed) { skipped++; continue; }

    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, task.userId));
    let taskSent = false;
    for (const sub of subs) {
      const payload: PushPayload = { title: "Task starts in 2 minutes", body: task.title, icon: "/icons/icon-192x192.png", badge: "/icons/icon-72x72.png", url: "/", taskId: task.id };
      const result = await sendPushNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
      if (result.success) { sent++; taskSent = true; } else if (result.error === "SUBSCRIPTION_EXPIRED") { await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id)); skipped++; } else failed++;
    }
    if (!taskSent) {
      await db.update(tasks)
        .set({ reminderSentFor: null })
        .where(and(eq(tasks.id, task.id), eq(tasks.reminderSentFor, task.dueDate)));
    }
    if (!subs.length) skipped++;
  }
  return { sent, failed, skipped };
}
