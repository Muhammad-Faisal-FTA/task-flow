import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { taskShareAllowlist, taskShares, taskLists, tasks, users } from "@/db/schema";
import type { TaskShareSnapshot } from "@/types/task";
import { formatDueDate, parseDueDate } from "@/utils/deriveStatus";

type UserChoice = { id: string; name: string; email: string; allowed: boolean };

export const SHARING_ERRORS: Record<string, { status: number; message: string }> = {
  INVALID_ALLOW_LIST: { status: 400, message: "The selected users are not valid." },
  USER_NOT_FOUND: { status: 404, message: "One or more selected users could not be found." },
  TASK_NOT_FOUND: { status: 404, message: "Task not found." },
  RECIPIENT_NOT_ALLOWED: { status: 403, message: "This user has not allowed you to share tasks with them." },
  SHARE_ALREADY_PENDING: { status: 409, message: "This task has already been shared with that user." },
  SHARE_NOT_FOUND: { status: 404, message: "Share invitation not found." },
  SHARE_NOT_PENDING: { status: 409, message: "This invitation has already been answered." },
  INVALID_SHARED_TASK: { status: 400, message: "This shared task cannot be copied." },
};

export function resolveSharingError(error: unknown) {
  return SHARING_ERRORS[error instanceof Error ? error.message : "UNKNOWN"]
    ?? { status: 500, message: "Something went wrong. Please try again." };
}

export async function getShareAllowList(ownerId: string): Promise<UserChoice[]> {
  const [allUsers, allowedUsers] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.isVerified, true)))
      .orderBy(asc(users.name)),
    db.select({ id: taskShareAllowlist.allowedUserId })
      .from(taskShareAllowlist)
      .where(eq(taskShareAllowlist.ownerId, ownerId)),
  ]);
  const allowedIds = new Set(allowedUsers.map((user) => user.id));
  return allUsers
    .filter((user) => user.id !== ownerId)
    .map((user) => ({ ...user, allowed: allowedIds.has(user.id) }));
}

export async function updateShareAllowList(ownerId: string, userIds: string[]) {
  if (userIds.includes(ownerId) || new Set(userIds).size !== userIds.length) {
    throw new Error("INVALID_ALLOW_LIST");
  }
  if (userIds.length) {
    const matches = await db.select({ id: users.id }).from(users)
      .where(and(eq(users.isVerified, true)));
    const verifiedIds = new Set(matches.map((user) => user.id));
    if (userIds.some((id) => !verifiedIds.has(id))) throw new Error("USER_NOT_FOUND");
  }

  await db.transaction(async (tx) => {
    await tx.delete(taskShareAllowlist).where(eq(taskShareAllowlist.ownerId, ownerId));
    if (userIds.length) {
      await tx.insert(taskShareAllowlist).values(
        userIds.map((allowedUserId) => ({ ownerId, allowedUserId })),
      );
    }
  });
  return getShareAllowList(ownerId);
}

export async function getEligibleShareRecipients(userId: string) {
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
  })
    .from(taskShareAllowlist)
    .innerJoin(users, eq(users.id, taskShareAllowlist.ownerId))
    .where(and(
      eq(taskShareAllowlist.allowedUserId, userId),
      eq(users.isVerified, true),
    ))
    .orderBy(asc(users.name));
}

function snapshotTask(task: typeof tasks.$inferSelect): TaskShareSnapshot {
  return {
    title: task.title,
    taskType: task.taskType,
    meetingLink: task.meetingLink,
    location: task.location,
    durationMinutes: task.durationMinutes,
    dueDate: formatDueDate(task.dueDate),
    dueTime: task.dueTime,
    startTime: task.startTime,
    endTime: task.endTime,
    priority: task.priority,
    cdfTracking: task.cdfTracking,
    repeat: task.repeat,
    repeatDays: task.repeatDays,
    repeatEndDate: formatDueDate(task.repeatEndDate),
    links: task.links,
  };
}

export async function shareTask(senderId: string, taskId: string, recipientId: string) {
  if (senderId === recipientId) throw new Error("RECIPIENT_NOT_ALLOWED");
  const [task, permission, duplicate] = await Promise.all([
    db.select().from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, senderId), isNull(tasks.deletedAt)))
      .limit(1),
    db.select({ userId: taskShareAllowlist.ownerId })
      .from(taskShareAllowlist)
      .innerJoin(users, eq(users.id, taskShareAllowlist.ownerId))
      .where(and(
        eq(taskShareAllowlist.ownerId, recipientId),
        eq(taskShareAllowlist.allowedUserId, senderId),
        eq(users.isVerified, true),
      ))
      .limit(1),
    db.select({ id: taskShares.id }).from(taskShares)
      .where(and(
        eq(taskShares.taskId, taskId),
        eq(taskShares.recipientId, recipientId),
        eq(taskShares.status, "pending"),
      ))
      .limit(1),
  ]);
  if (!task[0]) throw new Error("TASK_NOT_FOUND");
  if (!permission[0]) throw new Error("RECIPIENT_NOT_ALLOWED");
  if (duplicate[0]) throw new Error("SHARE_ALREADY_PENDING");

  const [share] = await db.insert(taskShares).values({
    taskId,
    senderId,
    recipientId,
    snapshot: snapshotTask(task[0]),
  }).returning({ id: taskShares.id });
  return { id: share.id };
}

export async function getPendingTaskShares(recipientId: string) {
  const shares = await db.select({
    id: taskShares.id,
    snapshot: taskShares.snapshot,
    createdAt: taskShares.createdAt,
    senderName: users.name,
    senderEmail: users.email,
  })
    .from(taskShares)
    .innerJoin(users, eq(users.id, taskShares.senderId))
    .where(and(
      eq(taskShares.recipientId, recipientId),
      eq(taskShares.status, "pending"),
    ))
    .orderBy(desc(taskShares.createdAt));
  return shares.map((share) => ({
    ...share,
    createdAt: share.createdAt.toISOString(),
  }));
}

export async function respondToTaskShare(recipientId: string, shareId: string, action: "accept" | "decline") {
  return db.transaction(async (tx) => {
    const [share] = await tx.select().from(taskShares)
      .where(and(
        eq(taskShares.id, shareId),
        eq(taskShares.recipientId, recipientId),
      ))
      .for("update")
      .limit(1);
    if (!share) throw new Error("SHARE_NOT_FOUND");
    if (share.status !== "pending") throw new Error("SHARE_NOT_PENDING");

    if (action === "decline") {
      await tx.update(taskShares)
        .set({ status: "declined", updatedAt: new Date() })
        .where(eq(taskShares.id, share.id));
      return { accepted: false };
    }

    const snapshot = share.snapshot;
    if (!snapshot.title.trim() || (snapshot.repeat === "custom" && !snapshot.repeatDays.length)) {
      throw new Error("INVALID_SHARED_TASK");
    }
    let [defaultList] = await tx.select({ id: taskLists.id }).from(taskLists)
      .where(and(eq(taskLists.userId, recipientId), eq(taskLists.isDefault, true)))
      .limit(1);
    if (!defaultList) {
      await tx.insert(taskLists).values({
        userId: recipientId,
        name: "Default",
        color: "#1E8BC3",
        isDefault: true,
      }).onConflictDoNothing();
      [defaultList] = await tx.select({ id: taskLists.id }).from(taskLists)
        .where(and(eq(taskLists.userId, recipientId), eq(taskLists.isDefault, true)))
        .limit(1);
    }
    if (!defaultList) throw new Error("INVALID_SHARED_TASK");

    const dueDate = parseDueDate(snapshot.dueDate);
    const repeatEndDate = parseDueDate(snapshot.repeatEndDate);
    if (dueDate && repeatEndDate && repeatEndDate < dueDate) throw new Error("INVALID_SHARED_TASK");
    const [copy] = await tx.insert(tasks).values({
      userId: recipientId,
      listId: defaultList.id,
      title: snapshot.title,
      taskType: snapshot.taskType,
      meetingLink: snapshot.meetingLink,
      location: snapshot.location,
      durationMinutes: snapshot.durationMinutes,
      completed: false,
      dueDate,
      dueTime: snapshot.dueTime,
      startTime: snapshot.startTime,
      endTime: snapshot.endTime,
      priority: snapshot.priority,
      cdfTracking: snapshot.cdfTracking,
      repeat: snapshot.repeat,
      repeatDays: snapshot.repeat === "custom" ? snapshot.repeatDays : [],
      repeatEndDate: snapshot.repeat === "none" ? null : repeatEndDate,
      links: snapshot.links,
    }).returning({ id: tasks.id });

    await tx.update(taskShares)
      .set({ status: "accepted", acceptedTaskId: copy.id, updatedAt: new Date() })
      .where(eq(taskShares.id, share.id));
    return { accepted: true, taskId: copy.id };
  });
}
