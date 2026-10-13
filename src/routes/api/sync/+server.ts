import { env } from '$env/dynamic/private';
import { error, type RequestHandler } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { syncAllCoursesToDb } from '$lib/server/syncCourses';

// post to /api/sync to trigger the sync process
export const POST: RequestHandler = async ({ request, fetch }) => {
    const secret = env.SYNC_SECRET;

    if(!secret) {
        error(503, 'Sync not configured');
    }

    // password to bytes
    const expected = Buffer.from(`Bearer ${secret}`);

    const actual = Buffer.from(request.headers.get('authorization') ?? '');

    // Compares two arrays of bytes in a time that does not depend on their contents
    if(expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        error(403, 'Forbidden');
    }

    try {
        await syncAllCoursesToDb(fetch);
        return new Response('OK');
    } catch (err) {
        console.error('SYNC ERROR:', err);

        if (err instanceof Error) {
            console.error('CAUSE:', err.cause);
        }

        error(500, 'Sync failed');
    }
    
};