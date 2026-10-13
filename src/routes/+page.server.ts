import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { courses } from '$lib/server/db/schema';
import { and, count, eq, or, ilike } from 'drizzle-orm';
import {
    CATEGORY_TITLES,
    type Category,
    type SearchCategory
} from '$lib/types/course';


export const load: PageServerLoad = async ({ url }) => {
    const categoryParam =
        url.searchParams.get('category_type') ?? 'Elective Modules';

    const ectsParam =
        url.searchParams.get('ects_number');

    const pageParam = Number(url.searchParams.get('page') ?? '1');
    const page = Number.isFinite(pageParam) && pageParam > 0
        ? pageParam
        : 1;

    const searchParam = url.searchParams.get('search') ?? '';
    const pageSize = 20;

    

    // Theory Modules в базе нет. Это срез Elective Modules по пути категории.
    // Незнакомое значение category_type откатывается на Practical Course, не на элективы.
    const selectedCategory: SearchCategory =
        categoryParam === 'Theory Modules'
            ? 'Theory Modules'
            : categoryParam in CATEGORY_TITLES
                ? categoryParam as Category
                : 'Practical Course';

    

    const selectedEcts =
        ectsParam ? Number(ectsParam) : undefined;

    const filters = [
        eq(courses.semester, '2026/27'),
        eq(courses.available, true)
    ];

    if(searchParam.trim()) {
        filters.push(
            ilike(courses.title, `%${searchParam.trim()}%`)
        );
    }

    if (selectedCategory === 'Theory Modules') {
        filters.push(
            eq(courses.category, 'Elective Modules')
        );

        // ECTS здесь специально не фильтруем: у теории в URL число есть, на выборку оно не влияет.
        // or() в типах Drizzle может быть undefined, поэтому !. Оба ilike переданы всегда.
        filters.push(
            or(
                ilike(courses.categoryPath, '%Theory%'), // ilike поиск без учета регистра
                ilike(courses.categoryPath, '%Theorie%')
            )!
        );
    } else {
        filters.push(
            eq(courses.category, selectedCategory)
        );

        if (selectedEcts !== undefined) {
            filters.push(
                eq(courses.ects, selectedEcts)
            );
        }
    }


    const result = await db
        .select()
        .from(courses)
        .where(and(...filters))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    // Второй запрос: limit выше уже отрезал страницу, а счётчик нужен по всем совпадениям.
    const [{ total }] = await db
        .select({
            total: count()
        })
        .from(courses)
        .where(and(...filters));


    return {
        courses: result,
        totalCourses: total,
        page,
        pageSize,
        categoryParam,
        ectsParam,
        searchParam
    };
};

