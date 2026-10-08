import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

import { db } from '$lib/server/db';
import { courses } from '$lib/server/db/schema';


export const load: PageServerLoad = async ({ params }) => {
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
        throw error(400, 'Course not found');
    }

    const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);

    if (!course) {
        throw error(404, 'Course not found');
    }

    return { course };
}