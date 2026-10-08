CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"tum_node_id" text NOT NULL,
	"title" text NOT NULL,
	"ects" integer,
	"category" text NOT NULL,
	"category_path" text,
	"course_url" text,
	"semester" text NOT NULL,
	"available" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "courses_tum_node_semester_unique" ON "courses" USING btree ("tum_node_id","semester");