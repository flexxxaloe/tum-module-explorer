# TUM Modules Picker

A web application for browsing and filtering Master's in Informatics modules at the Technical University of Munich (TUM).

TUMonline organizes modules in a hierarchical curriculum tree, making it difficult to get an overview of available courses. Students have to navigate through multiple categories and open individual modules to check whether they are offered in the current semester. There is also no convenient way to filter modules by ECTS, category, or title.

This project simplifies the process by collecting currently offered modules from TUMonline, storing them in PostgreSQL, and presenting them in a searchable and filterable list.

## Features

- Browse available modules by category, including Practical Courses, Seminars, Electives, Support Electives, and Theory Modules.
- Filter modules by ECTS or search by title.
- View module details, including course content, prerequisites, learning objectives, and registration information.
- Open the original course page on TUMonline.
- Navigate between the module list and details without losing selected filters or pagination.
- Refresh course data from TUMonline on demand.
- Browse results with pagination (20 modules per page).
- Save courses from the list or a course page and review them on My Courses, including how many are saved and their total ECTS.
- Saved courses stay in the browser after a refresh. They are not written to PostgreSQL, so refreshing TUMonline data does not change the list.

## Tech stack

- Frontend: Svelte 5, SvelteKit, TypeScript
- Backend: SvelteKit server routes
- Database: PostgreSQL, Drizzle ORM
- Web scraping: Cheerio
- Tooling: Vite, Docker, Drizzle Kit, ESLint, Prettier

## How it works

The list page never calls TUMonline. **Refresh data** sends `POST /api/sync`, which walks the public Studienplan for Master Informatics (plan `5217`, academic year `2026/27`).

Child nodes are not included in the first HTML page. Each level is requested separately, and Cheerio reads the node title, type, and credits from the returned markup. Only courses with an offering for the selected academic year are included. Course descriptions and additional details are retrieved from TUMonline's API.

Practical courses and seminars are stored as courses, with fixed ECTS values of 10 and 5. Electives and support electives are stored as modules, using the link of the first course offering that exists this year. Rows are upserted on the study-plan node id and semester, so a later refresh updates the current semester instead of inserting duplicates.

Saving a course stores its id, title, and ECTS in `localStorage`. My Courses reads that list in the browser. Opening a saved course returns to My Courses; opening one from the catalog returns to the filtered list.

## Getting started

Prerequisites: Node.js, npm, and Docker with Docker Compose.

Start PostgreSQL:

```sh
docker compose up -d
```

Copy `.env.example` to `.env` and replace `your_password`. Use the same user, password, and database name in `DATABASE_URL`. Docker Compose reads `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME` from that file; the app reads `DATABASE_URL`. `.env` stays gitignored.

Install dependencies, apply the migrations in `drizzle/`, and start the dev server:

```sh
npm install
npx drizzle-kit migrate
npm run dev
```

Open the local URL printed by Vite. The table stays empty until you click **Refresh data**. That request walks TUMonline one node at a time and takes several minutes.

## Project structure

```text
src/routes/+page.svelte                     Catalog UI: filters, table, pagination
src/routes/+page.server.ts                  Reads courses from PostgreSQL
src/routes/+layout.svelte                   Navigation and the saved-courses store
src/routes/my-courses/+page.svelte          Saved courses and total ECTS
src/routes/courses/[id]/                    Module detail page
src/lib/components/SaveCourseButton.svelte  Save and unsave control
src/lib/savedCourses.svelte.ts              Browser storage for saved courses
src/lib/types/savedCourse.ts                Saved course fields
src/routes/api/sync/+server.ts              Starts a full sync
src/lib/server/tumonline.ts                 TUMonline requests and parsing
src/lib/server/syncCourses.ts               Walks the study plan and writes rows
src/lib/server/db/schema.ts                 courses table
src/lib/types/course.ts                     Category names and fixed ECTS values
drizzle/                                    SQL migrations
docker-compose.yml                          Local PostgreSQL
```
