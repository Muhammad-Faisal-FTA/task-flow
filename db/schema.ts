import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import type { TaskLink } from "@/types/task";

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export const repeatEnum = pgEnum("repeat_frequency", ["none", "daily", "weekdays", "weekly", "monthly", "yearly"]);
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(), name: varchar("name", { length: 50 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(), password: text("password").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(), verificationOtpHash: text("verification_otp_hash"),
  verificationOtpExpiry: timestamp("verification_otp_expiry", { withTimezone: true }),
  resetPasswordToken: text("reset_password_token"), resetPasswordExpiry: timestamp("reset_password_expiry", { withTimezone: true }), ...timestamps(),
}, (t) => [uniqueIndex("users_email_unique").on(sql`lower(${t.email})`), index("users_reset_token_idx").on(t.resetPasswordToken)]);
export const taskLists = pgTable("task_lists", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 50 }).notNull(), color: varchar("color", { length: 7 }).default("#1E8BC3").notNull(),
  isDefault: boolean("is_default").default(false).notNull(), ...timestamps(),
}, (t) => [uniqueIndex("task_lists_user_name_unique").on(t.userId, t.name), uniqueIndex("task_lists_one_default").on(t.userId).where(sql`${t.isDefault} = true`), check("task_lists_color_check", sql`${t.color} ~ '^#[0-9A-Fa-f]{6}$'`)]);
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  listId: uuid("list_id").references(() => taskLists.id, { onDelete: "restrict" }).notNull(), title: varchar("title", { length: 255 }).notNull(),
  completed: boolean("completed").default(false).notNull(), completedAt: timestamp("completed_at", { withTimezone: true }), dueDate: date("due_date", { mode: "date" }),
  dueTime: varchar("due_time", { length: 5 }), startTime: varchar("start_time", { length: 5 }), endTime: varchar("end_time", { length: 5 }), repeat: repeatEnum("repeat").default("none").notNull(), deletedAt: timestamp("deleted_at", { withTimezone: true }),
  links: jsonb("links").$type<TaskLink[]>().default([]).notNull(), ...timestamps(),
}, (t) => [index("tasks_user_due_idx").on(t.userId, t.dueDate), index("tasks_user_list_due_idx").on(t.userId, t.listId, t.dueDate), check("tasks_due_time_check", sql`${t.dueTime} is null or ${t.dueTime} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`)]);
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), endpoint: text("endpoint").unique().notNull(),
  p256dh: text("p256dh").notNull(), auth: text("auth").notNull(), userAgent: text("user_agent"), ...timestamps(),
});
export const cdfSettings = pgTable("cdf_settings", { id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(), enabled: boolean("enabled").default(false).notNull(), ...timestamps() });
export const cdfEvents = pgTable("cdf_events", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  taskTitle: varchar("task_title", { length: 255 }).notNull(), listId: uuid("list_id").references(() => taskLists.id, { onDelete: "cascade" }).notNull(), repeat: repeatEnum("repeat").notNull(),
  dueDate: date("due_date", { mode: "date" }), dueTime: varchar("due_time", { length: 5 }), completedAt: timestamp("completed_at", { withTimezone: true }).notNull(), onTime: boolean("on_time").notNull(),
  lateByMs: integer("late_by_ms").default(0).notNull(), focusScore: integer("focus_score"), focusEnteredAt: timestamp("focus_entered_at", { withTimezone: true }), ...timestamps(),
}, (t) => [index("cdf_events_user_completed_idx").on(t.userId, t.completedAt)]);
export const cdfScores = pgTable("cdf_scores", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
  consistencyScore: integer("consistency_score").default(0).notNull(), consistencyStreak: integer("consistency_streak").default(0).notNull(), longestStreak: integer("longest_streak").default(0).notNull(),
  totalExpected: integer("total_expected").default(0).notNull(), totalCompleted: integer("total_completed").default(0).notNull(), disciplineScore: integer("discipline_score").default(0).notNull(),
  onTimeCount: integer("on_time_count").default(0).notNull(), totalTimedTasks: integer("total_timed_tasks").default(0).notNull(), focusScore: integer("focus_score").default(0).notNull(),
  focusEntries: integer("focus_entries").default(0).notNull(), focusTotal: integer("focus_total").default(0).notNull(), windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  windowEnd: timestamp("window_end", { withTimezone: true }).notNull(), lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true }).notNull(), ...timestamps(),
});
