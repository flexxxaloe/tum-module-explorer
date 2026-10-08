import { getRootNodeId, getChildren, getNodeDetails, getCourseDescription } from './tumonline';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { courses } from './db/schema';
import { CATEGORY_TITLES, CATEGORY_ECTS, type Category } from '$lib/types/course';

type Course = {
    nodeId: string;
    title: string;
    ects: number | null;
    nodeType: number | null;
    courseUrl: string | null;
    categoryPath?: string;
    category: Category;
};

async function fetchCoursesFromTum(
    fetchFn: typeof fetch,
    selectedCategory: Category
): Promise<Course[]> {
    const tumTitle = CATEGORY_TITLES[selectedCategory];

    const nodeId = await getRootNodeId(fetchFn, tumTitle);

    if (!nodeId) {
        throw new Error('Root node not found');
    }

    const availableCourses: Course[] = [];

    // Практикум и семинар плоские: корень → первая папка → узлы kt120.
    // В базу пишется сам курс. Кредиты подменяются из CATEGORY_ECTS, не из ячейки дерева.
    if (
        selectedCategory === 'Seminar Course' ||
        selectedCategory === 'Practical Course'
    ) {
        const firstLevel = await getChildren(fetchFn, nodeId);

        const secondLevel = await getChildren(
            fetchFn,
            firstLevel[0].nodeId
        );

        const courseNodes = secondLevel.filter(
            child => child.nodeType === 120
        );

        for (const course of courseNodes) {
            const details = await getNodeDetails(
                fetchFn,
                course.nodeId
            );

            if (details.exists) {
                availableCourses.push({
                    ...course,
                    ects: CATEGORY_ECTS[selectedCategory] ?? course.ects,
                    category: selectedCategory,
                    categoryPath: selectedCategory,
                    courseUrl: details.courseUrl
                });
            }
        }
    }

    // Überfachliche Grundlagen обходится по позиции детей, не по названию.
    // [0] — первая папка, из неё первые две подпапки. [1] пропускается.
    // [2] — третья папка, из неё только узлы типа 11.
    // Если сайт поменяет порядок папок, выборка поедет.
    else if (selectedCategory === 'Support Electives') {
        const firstLevel = await getChildren(fetchFn, nodeId);

        const supportNodes: Array<{
            nodeId: string;
            title: string;
            ects: number | null;
            nodeType: number | null;
            categoryPath?: string;
        }> = [];

        const firstFolderChildren = await getChildren(
            fetchFn,
            firstLevel[0].nodeId
        );

        for (const folder of firstFolderChildren.slice(0, 2)) {
            const children = await getChildren(
                fetchFn,
                folder.nodeId
            );

            supportNodes.push(
                ...children.map(child => ({
                    ...child,
                    categoryPath:
                        `${firstLevel[0].title} / ${folder.title}`
                }))
            );
        }

        const thirdFolderChildren = await getChildren(
            fetchFn,
            firstLevel[2].nodeId
        );

        supportNodes.push(
            ...thirdFolderChildren
                .filter(node => node.nodeType === 11)
                .map(node => ({
                    ...node,
                    categoryPath: firstLevel[2].title
                }))
        );

        const modules = supportNodes.filter(
            node => node.nodeType === 11 || node.nodeType === 4
        );

        // В каталог попадает модуль, не каждая лекция. Достаточно первой kt120,
        // у которой в этом году есть запись: её URL становится ссылкой модуля.
        for (const module of modules) {
            const moduleChildren = await getChildren(
                fetchFn,
                module.nodeId
            );

            const courseNodes = moduleChildren.filter(
                child => child.nodeType === 120
            );

            for (const courseNode of courseNodes) {
                const details = await getNodeDetails(
                    fetchFn,
                    courseNode.nodeId
                );

                if (details.exists) {
                    availableCourses.push({
                        ...module,
                        category: selectedCategory,
                        courseUrl: details.courseUrl
                    });

                    break;
                }
            }
        }
    }

    // Wahlmodule: область (ALG, CGV, …) → модули.
    // Theory/Theorie — лишняя вложенность: детей поднимаем и пишем путь «область / Theory».
    // По этому пути список потом отличает Theory Modules от остальных элективов.
    else if (selectedCategory === 'Elective Modules') {
        const firstLevel = await getChildren(fetchFn, nodeId);

        const electiveNodes: Array<{
            nodeId: string;
            title: string;
            ects: number | null;
            nodeType: number | null;
            categoryPath?: string;
        }> = [];

        for (const folder of firstLevel) {
            const secondLevel = await getChildren(
                fetchFn,
                folder.nodeId
            );

            for (const node of secondLevel) {
                if (
                    node.title.includes('Theory') ||
                    node.title.includes('Theorie')
                ) {
                    const thirdLevel = await getChildren(
                        fetchFn,
                        node.nodeId
                    );

                    electiveNodes.push(
                        ...thirdLevel.map(child => ({
                            ...child,
                            categoryPath:
                                `${folder.title} / ${node.title}`
                        }))
                    );
                } else {
                    electiveNodes.push({
                        ...node,
                        categoryPath: folder.title
                    });
                }
            }
        }

        const modules = electiveNodes.filter(
            node => node.nodeType === 11
        );

        // То же, что у Support Electives: строка в базе — модуль, ссылка — первая живая лекция года.
        for (const module of modules) {
            const moduleChildren = await getChildren(
                fetchFn,
                module.nodeId
            );

            const courseNodes = moduleChildren.filter(
                child => child.nodeType === 120
            );

            for (const courseNode of courseNodes) {
                const details = await getNodeDetails(
                    fetchFn,
                    courseNode.nodeId
                );

                if (details.exists) {
                    availableCourses.push({
                        ...module,
                        category: selectedCategory,
                        courseUrl: details.courseUrl
                    });

                    break;
                }
            }
        }
    }

    return availableCourses;
}




export async function syncCoursesToDb(
    fetchFn: typeof fetch,
    selectedCategory: Category
): Promise<void> {
    console.log('START SYNC:', selectedCategory);

    const tumCourses = await fetchCoursesFromTum(
        fetchFn,
        selectedCategory
    );

    console.log(
        'FOUND:',
        selectedCategory,
        tumCourses.length
    );

    if (tumCourses.length === 0) {
        return;
    }

    const rows = [];

    for (const course of tumCourses) {
        // .../course/950970258 — id описания для REST, не tumNodeId из дерева.
        const courseId = course.courseUrl
            ?.match(/\/course\/(\d+)/)?.[1];

        console.log('Loading description:', course.title, courseId);

        const description = courseId
            ? await getCourseDescription(courseId, fetch)
            : null;


        rows.push({
            tumNodeId: course.nodeId,
            title: course.title,
            ects: course.ects,
            category: course.category,
            categoryPath: course.categoryPath ?? null,
            courseUrl: course.courseUrl,
            semester: '2026/27',
            available: true,

            content: description?.content ?? null,
            previousKnowledge: description?.previousKnowledge ?? null,
            objective: description?.objective ?? null,
            teachingMethod: description?.teachingMethod ?? null,
            registration: description?.registration ?? null,
            note: description?.note ?? null

        });
    }

    try {
    await db
    .insert(courses)
    .values(
        rows
    )
    .onConflictDoUpdate({
        target: [courses.tumNodeId, courses.semester],
        // excluded — строка, которую только что пытались вставить, не старая запись в таблице.
        set: {
            title: sql`excluded.title`,
            ects: sql`excluded.ects`,
            category: sql`excluded.category`,
            categoryPath: sql`excluded.category_path`,
            courseUrl: sql`excluded.course_url`,
            available: true,

            content: sql`excluded.content`,
            previousKnowledge: sql`excluded.previous_knowledge`,
            objective: sql`excluded.objective`,
            teachingMethod: sql`excluded.teaching_method`,
            registration: sql`excluded.registration`,
            note: sql`excluded.note`
        }
    });
    } catch (error) {
        const cause = error instanceof Error ? error.cause : null;

        const message = cause instanceof Error
            ? cause.message
            : error instanceof Error
                ? error.message.slice(0, 300)
                : String(error).slice(0, 300);

        console.error('DB ERROR:', message);

        throw new Error(`Database sync failed: ${message}`, {
            cause: error
        });
    }
}


export async function syncAllCoursesToDb(fetchFn: typeof fetch) {
    const categories: Category[] = [
        'Practical Course',
        'Seminar Course',
        'Elective Modules',
        'Support Electives'
    ];

    for (const category of categories) {
        await syncCoursesToDb(fetchFn, category);
    }
}