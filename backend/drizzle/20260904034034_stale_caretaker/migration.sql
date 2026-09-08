ALTER TABLE "responses" ADD COLUMN "voter_id" varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "responses" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "responses" DROP CONSTRAINT "unique_response";--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "unique_response" UNIQUE("poll_id","voter_id");