ALTER TYPE "public"."repeat_frequency" ADD VALUE 'custom';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "repeat_days" integer[] DEFAULT '{}'::integer[] NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "repeat_end_date" date;