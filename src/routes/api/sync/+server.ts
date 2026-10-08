import type { RequestHandler } from './$types';
import { syncAllCoursesToDb } from '$lib/server/syncCourses';

// post to /api/sync to trigger the sync process
export const POST: RequestHandler = async ({ fetch }) => {
    await syncAllCoursesToDb(fetch);

    return new Response('OK');
};