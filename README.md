# TUM Modules Picker

**Live Demo:** https://tum-module-explorer.vercel.app

A web application for browsing and filtering Master's in Informatics modules at the Technical University of Munich (TUM).

TUMonline organizes modules in a hierarchical curriculum tree, making it difficult to get an overview of available courses. Students have to navigate through multiple categories and open individual modules to check whether they are offered in the current semester. There is also no convenient way to filter modules by ECTS, category, or title.

This project simplifies the process by collecting currently offered modules from TUMonline, storing them in PostgreSQL, and presenting them in a searchable and filterable list.

## Features

- Browse available modules by category, including Practical Courses, Seminars, Electives, Support Electives, and Theory Modules.
- Filter modules by ECTS or search by title.
- View module details, including course content, prerequisites, learning objectives, and registration information.
- Open the original course page on TUMonline.
- Navigate between the module list and details without losing selected filters or pagination.
- Refresh course data through a password-protected admin page, with automatic retries for temporary network errors.
- Browse results with pagination (20 modules per page).
- Save courses from the list or a course page and review them on My Courses, including how many are saved and their total ECTS.
- Saved courses stay in the browser after a refresh. They are not written to PostgreSQL, so refreshing TUMonline data does not change the list.

## Tech stack

- Frontend: Svelte 5, SvelteKit, TypeScript
- Backend: SvelteKit server routes
- Database: PostgreSQL, Drizzle ORM
- Web scraping: Cheerio
- Tooling: Vite, Docker, Drizzle Kit, ESLint, Prettier
- Deployment: Vercel, Neon PostgreSQL

## How it works

The catalog reads course data from PostgreSQL without making requests to TUMonline. Course data is collected from TUMonline through a password-protected admin endpoint.

The synchronization process traverses the public TUMonline curriculum tree, extracts module information using Cheerio, and retrieves additional course details through TUMonline's API. Records are upserted into PostgreSQL to update existing entries without creating duplicates. Temporary network errors are handled with automatic retries.

The production application is hosted on Vercel and uses Neon PostgreSQL. Local development uses PostgreSQL through Docker Compose.

Saved courses are stored in the browser's `localStorage`, independently of the shared PostgreSQL database. This allows users to maintain their own course lists without creating an account.

## Getting started

Prerequisites: Node.js, npm, and Docker with Docker Compose.

Copy `.env.example` to `.env` and configure the environment variables:

- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` — PostgreSQL credentials used by Docker Compose.
- `DATABASE_URL` — PostgreSQL connection string using the same credentials.
- `SYNC_SECRET` — password for accessing the admin synchronization endpoint.

Start PostgreSQL:

```sh
docker compose up -d
```

Install dependencies, apply the database migrations, and start the development server:

```sh
npm install
npx drizzle-kit migrate
npm run dev
```

Open the local development URL shown in the terminal (usually `http://localhost:5173`). To populate the database, open `/admin` and enter the password configured in `SYNC_SECRET`. Synchronization may take several minutes.

## Project structure

```text
src/routes/+page.svelte                     Catalog UI: filters, table, pagination
src/routes/+page.server.ts                  Reads courses from PostgreSQL
src/routes/+layout.svelte                   Navigation and the saved-courses store
src/routes/my-courses/+page.svelte          Saved courses and total ECTS
src/routes/courses/[id]/                    Module detail page
src/routes/admin/+page.svelte               Admin page for password-protected synchronization
src/routes/api/sync/+server.ts              Protected endpoint for course synchronization
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
