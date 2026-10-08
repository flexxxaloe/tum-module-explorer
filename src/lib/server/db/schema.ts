import {
    pgTable,
    serial,
    text,
    integer,
    boolean,
    uniqueIndex
} from 'drizzle-orm/pg-core';

export const courses = pgTable('courses', {
    id: serial('id').primaryKey(),

    tumNodeId: text('tum_node_id').notNull(),
    title: text('title').notNull(),

    ects: integer('ects'),

    category: text('category').notNull(),
    categoryPath: text('category_path'),

    courseUrl: text('course_url'),

    semester: text('semester').notNull(),

    available: boolean('available').notNull().default(true),

    content: text('content'),
    previousKnowledge: text('previous_knowledge'),
    objective: text('objective'),
    teachingMethod: text('teaching_method'),
    registration: text('registration'),
    note: text('note')
},
    (table) => [
        // Ключ upsert: тот же узел в другом семестре — новая строка, старый год не затирается.
        uniqueIndex(
            'courses_tum_node_semester_unique'
        ).on(table.tumNodeId, table.semester)
    ]
);