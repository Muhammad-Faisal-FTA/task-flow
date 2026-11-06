DROP INDEX IF EXISTS "users_reset_token_idx";
ALTER TABLE "users" DROP COLUMN "reset_password_token";
ALTER TABLE "users" DROP COLUMN "reset_password_expiry";
ALTER TABLE "users" ADD COLUMN "reset_password_otp_hash" text;
ALTER TABLE "users" ADD COLUMN "reset_password_otp_expiry" timestamp with time zone;
