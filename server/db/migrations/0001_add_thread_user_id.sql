-- Add user_id column to threads and workflows for data isolation between users
ALTER TABLE "threads" ADD COLUMN "user_id" varchar(255) NOT NULL DEFAULT 'anonymous';
--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "user_id" varchar(255) NOT NULL DEFAULT 'anonymous';
