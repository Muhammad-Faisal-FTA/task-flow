DROP INDEX "users_verify_token_idx";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_otp_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_otp_expiry" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verify_token";