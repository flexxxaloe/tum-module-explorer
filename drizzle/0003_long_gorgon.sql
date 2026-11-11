CREATE TABLE "offerings" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"semester" text NOT NULL,
	"course_url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;