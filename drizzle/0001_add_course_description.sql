DROP INDEX "courses_tum_node_semester_unique";--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "content" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "previous_knowledge" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "objective" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "teaching_method" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "registration" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "note" text;