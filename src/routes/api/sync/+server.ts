import type { RequestHandler } from './$types';
import { syncAllCoursesToDb } from '$lib/server/syncCourses';

// post to /api/sync to trigger the sync process
export const POST: RequestHandler = async ({ fetch }) => {
    try {
        await syncAllCoursesToDb(fetch);
        return new Response('OK');
    } catch (error) {
        console.error('SYNC ERROR:', error);

        if (error instanceof Error) {
            console.error('CAUSE:', error.cause);
        }

        throw error;
    }
};