CREATE TYPE "task_share_status" AS ENUM ('pending', 'accepted', 'declined');
--> statement-breakpoint
CREATE TABLE "task_share_allowlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"allowed_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_share_allowlist_no_self_check" CHECK ("owner_id" <> "allowed_user_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "task_share_allowlist_owner_allowed_unique" ON "task_share_allowlist" ("owner_id", "allowed_user_id");
--> statement-breakpoint
CREATE INDEX "task_share_allowlist_allowed_owner_idx" ON "task_share_allowlist" ("allowed_user_id", "owner_id");
--> statement-breakpoint
CREATE TABLE "task_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid REFERENCES "tasks"("id") ON DELETE SET NULL,
	"sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"recipient_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"snapshot" jsonb NOT NULL,
	"status" "task_share_status" DEFAULT 'pending' NOT NULL,
	"accepted_task_id" uuid REFERENCES "tasks"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "task_shares_pending_task_recipient_unique" ON "task_shares" ("task_id", "recipient_id") WHERE "status" = 'pending';
--> statement-breakpoint
CREATE INDEX "task_shares_recipient_status_idx" ON "task_shares" ("recipient_id", "status", "created_at");
