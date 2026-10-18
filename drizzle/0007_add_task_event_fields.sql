CREATE TYPE "public"."task_type" AS ENUM('task', 'event');--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "task_type" "task_type" DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "meeting_link" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "duration_minutes" integer;