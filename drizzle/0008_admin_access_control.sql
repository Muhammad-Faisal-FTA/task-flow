CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;
CREATE TABLE "user_permissions" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "feature" varchar(40) NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "user_permissions_user_feature_unique" ON "user_permissions" USING btree ("user_id", "feature");
CREATE TABLE "platform_settings" (
  "service" varchar(40) PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
