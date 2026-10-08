// Названия папок в Studienplan. Theory Modules здесь нет: это не отдельная синхронизация,
// а фильтр по уже загруженным Elective Modules (см. +page.server.ts).
export const CATEGORY_TITLES = {
    'Practical Course': 'Master-Praktikum',
    'Seminar Course': 'Master-Seminar',
    'Elective Modules': 'Wahlmodulkatalog Informatik',
    'Support Electives': 'Wahlmodulkatalog Überfachliche Grundlagen'
} as const;

export type Category = keyof typeof CATEGORY_TITLES;

export type SearchCategory =
    | Category
    | 'Theory Modules';

// У практикума и семинара в базу пишется узел курса, а кредиты в дереве лежат на экзамене.
// Поэтому ECTS для этих двух категорий заданы здесь, а не читаются из ячейки.
export const CATEGORY_ECTS: Partial<Record<Category, number>> = {
    'Practical Course': 10,
    'Seminar Course': 5
};