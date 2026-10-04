CREATE TYPE "public"."task_priority" AS ENUM('A', 'B', 'C', 'D');--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" "task_priority" DEFAULT 'C' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "cdf_tracking" boolean DEFAULT true NOT NULL;