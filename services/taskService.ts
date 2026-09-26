import { and, asc, count, desc, eq, ilike, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { taskLists, tasks } from "@/db/schema";
import { deriveStatus, parseDueDate, formatDueDate } from "@/utils/deriveStatus";
import { groupTasksByStatus } from "@/utils/taskGrouping";
import type { TaskDTO, TaskListDTO, GroupedTasks, CreateTaskInput, UpdateTaskInput, CreateListInput, UpdateListInput, TaskQueryParams } from "@/types/task";

type Task = typeof tasks.$inferSelect;
type List = typeof taskLists.$inferSelect;
const taskDto = (t: Task): TaskDTO => ({ id: t.id, userId: t.userId, listId: t.listId, title: t.title, completed: t.completed, completedAt: t.completedAt?.toISOString() ?? null, dueDate: formatDueDate(t.dueDate), dueTime: t.dueTime, startTime: t.startTime, endTime: t.endTime, repeat: t.repeat, links: t.links, status: deriveStatus(t.dueDate, t.completed, t.deletedAt), deletedAt: t.deletedAt?.toISOString() ?? null, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() });
const listDto = (l: List, taskCount = 0, overdueCount = 0): TaskListDTO => ({ id: l.id, userId: l.userId, name: l.name, color: l.color, isDefault: l.isDefault, taskCount, overdueCount, createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString() });
const ownedList = async (userId: string, id: string) => (await db.select().from(taskLists).where(and(eq(taskLists.id, id), eq(taskLists.userId, userId))).limit(1))[0];
const ownedTask = async (userId: string, id: string) => (await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1))[0];

export const TASK_ERRORS: Record<string, { status: number; message: string }> = { INVALID_ID: { status: 400, message: "Invalid ID format." }, TASK_NOT_FOUND: { status: 404, message: "Task not found." }, LIST_NOT_FOUND: { status: 404, message: "List not found." }, LIST_NAME_TAKEN: { status: 409, message: "A list with this name already exists." }, CANNOT_DELETE_DEFAULT: { status: 400, message: "Cannot delete the default list." }, LIST_HAS_TASKS: { status: 400, message: "Cannot delete a list that contains tasks." } };
export function resolveTaskError(error: unknown) { return TASK_ERRORS[error instanceof Error ? error.message : "UNKNOWN"] ?? { status: 500, message: "Something went wrong. Please try again." }; }

export async function createDefaultList(userId: string): Promise<TaskListDTO> {
  const existing = (await db.select().from(taskLists).where(and(eq(taskLists.userId, userId), eq(taskLists.isDefault, true))).limit(1))[0];
  if (existing) return listDto(existing);
  return listDto((await db.insert(taskLists).values({ userId, name: "Default", color: "#1E8BC3", isDefault: true }).returning())[0]);
}
export async function getUserLists(userId: string): Promise<TaskListDTO[]> {
  const rows = await db.select({ list: taskLists, taskCount: count(tasks.id), overdueCount: sql<number>`count(${tasks.id}) filter (where ${tasks.completed} = false and ${tasks.dueDate} < current_date)` }).from(taskLists).leftJoin(tasks, and(eq(tasks.listId, taskLists.id), isNull(tasks.deletedAt))).where(eq(taskLists.userId, userId)).groupBy(taskLists.id).orderBy(desc(taskLists.isDefault), asc(taskLists.createdAt));
  return rows.map((r) => listDto(r.list, Number(r.taskCount), Number(r.overdueCount)));
}
export async function createList(userId: string, input: CreateListInput): Promise<TaskListDTO> {
  const name = input.name.trim();
  if ((await db.select({ id: taskLists.id }).from(taskLists).where(and(eq(taskLists.userId, userId), ilike(taskLists.name, name))).limit(1))[0]) throw new Error("LIST_NAME_TAKEN");
  return listDto((await db.insert(taskLists).values({ userId, name, color: input.color }).returning())[0]);
}
export async function updateList(userId: string, id: string, input: UpdateListInput): Promise<TaskListDTO> {
  const list = await ownedList(userId, id); if (!list) throw new Error("LIST_NOT_FOUND");
  if (input.name && (await db.select({ id: taskLists.id }).from(taskLists).where(and(eq(taskLists.userId, userId), ilike(taskLists.name, input.name.trim()), ne(taskLists.id, id))).limit(1))[0]) throw new Error("LIST_NAME_TAKEN");
  return listDto((await db.update(taskLists).set({ ...(input.name && { name: input.name.trim() }), ...(input.color && { color: input.color }), updatedAt: new Date() }).where(eq(taskLists.id, id)).returning())[0]);
}
export async function deleteList(userId: string, id: string) {
  const list = await ownedList(userId, id); if (!list) throw new Error("LIST_NOT_FOUND"); if (list.isDefault) throw new Error("CANNOT_DELETE_DEFAULT");
  if (Number((await db.select({ value: count() }).from(tasks).where(and(eq(tasks.listId, id), isNull(tasks.deletedAt))))[0].value)) throw new Error("LIST_HAS_TASKS");
  await db.delete(taskLists).where(eq(taskLists.id, id)); return { message: "List deleted successfully." };
}
export async function getUserTasks(userId: string, params: TaskQueryParams = {}): Promise<GroupedTasks | TaskDTO[]> {
  const filters = [eq(tasks.userId, userId), isNull(tasks.deletedAt)];
  if (params.listId) filters.push(eq(tasks.listId, params.listId)); if (params.includeCompleted === false) filters.push(eq(tasks.completed, false)); if (params.search?.trim()) filters.push(ilike(tasks.title, `%${params.search.trim()}%`));
  const result = (await db.select().from(tasks).where(and(...filters)).orderBy(asc(tasks.dueDate), asc(tasks.createdAt))).map(taskDto);
  return params.grouped === false ? result : groupTasksByStatus(result);
}
export async function getTaskById(userId: string, id: string) { const task = await ownedTask(userId, id); if (!task) throw new Error("TASK_NOT_FOUND"); return taskDto(task); }
export async function createTask(userId: string, input: CreateTaskInput) {
  if (!(await ownedList(userId, input.listId))) throw new Error("LIST_NOT_FOUND");
  const [task] = await db.insert(tasks).values({ userId, listId: input.listId, title: input.title.trim(), dueDate: parseDueDate(input.dueDate), dueTime: input.dueTime ?? null, startTime: input.startTime ?? input.dueTime ?? null, endTime: input.endTime ?? null, repeat: input.repeat ?? "none", links: input.links ?? [] }).returning(); return taskDto(task);
}
export async function updateTask(userId: string, id: string, input: UpdateTaskInput) {
  const current = await ownedTask(userId, id); if (!current) throw new Error("TASK_NOT_FOUND"); if (input.listId && !(await ownedList(userId, input.listId))) throw new Error("LIST_NOT_FOUND");
  const completed = input.completed ?? current.completed;
  const [task] = await db.update(tasks).set({ ...(input.listId && { listId: input.listId }), ...(input.title !== undefined && { title: input.title.trim() }), ...(input.dueDate !== undefined && { dueDate: parseDueDate(input.dueDate) }), ...(input.dueTime !== undefined && { dueTime: input.dueTime }), ...(input.startTime !== undefined && { startTime: input.startTime }), ...(input.endTime !== undefined && { endTime: input.endTime }), ...(input.repeat && { repeat: input.repeat }), ...(input.links && { links: input.links }), ...(input.completed !== undefined && { completed, completedAt: completed ? new Date() : null }), updatedAt: new Date() }).where(eq(tasks.id, id)).returning(); return taskDto(task);
}
export async function toggleTaskComplete(userId: string, id: string) { const t = await ownedTask(userId, id); if (!t) throw new Error("TASK_NOT_FOUND"); const [updated] = await db.update(tasks).set({ completed: !t.completed, completedAt: !t.completed ? new Date() : null, updatedAt: new Date() }).where(eq(tasks.id, id)).returning(); return taskDto(updated); }
export async function deleteTask(userId: string, id: string) { if (!(await ownedTask(userId, id))) throw new Error("TASK_NOT_FOUND"); return taskDto((await db.update(tasks).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(tasks.id, id)).returning())[0]); }
export async function restoreTask(userId: string, id: string) { if (!(await ownedTask(userId, id))) throw new Error("TASK_NOT_FOUND"); return taskDto((await db.update(tasks).set({ deletedAt: null, updatedAt: new Date() }).where(eq(tasks.id, id)).returning())[0]); }
export async function permanentDeleteTask(userId: string, id: string) { const deleted = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning({ id: tasks.id }); if (!deleted[0]) throw new Error("TASK_NOT_FOUND"); return { message: "Task permanently deleted." }; }
export async function getDeletedTasks(userId: string) { return (await db.select().from(tasks).where(and(eq(tasks.userId, userId), isNotNull(tasks.deletedAt))).orderBy(desc(tasks.deletedAt))).map(taskDto); }
