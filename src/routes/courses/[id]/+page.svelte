<script lang='ts'>
    import type { PageProps } from './$types';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';

    import { getContext } from 'svelte';
    import type { SavedCoursesStore } from '$lib/savedCourses.svelte';
    import SaveCourseButton from '$lib/components/SaveCourseButton.svelte';

    const store = getContext<SavedCoursesStore>('savedCourses');

    const fromSaved = $derived(
        page.url.searchParams.get('from') === 'saved'
    );

    let {data}: PageProps = $props();

    const sections =[
        { key: 'content', title: 'Content' },
        { key: 'previousKnowledge', title: 'Previous knowledge expected' },
        { key: 'objective', title: 'Objective' },
        { key: 'teachingMethod', title: 'Teaching and learning method' },
        { key: 'registration', title: 'Course Criteria and Registration' },
        { key: 'note', title: 'Note' }
    ] as const;

</script>

<svelte:head>
    <title>{data.course.title} | TUM Modules Picker</title>
</svelte:head>

<main>

    <!-- searchParams с карточки курса — те же фильтры и страница, с которыми её открыли -->
    <a
        class="back-button"
        href={fromSaved
            ? resolve('/my-courses')
            : resolve(`/?${page.url.searchParams.toString()}`)}
    >
        ← {fromSaved ? 'My Courses' : 'Course List'}
    </a>
    <header class="course-header">
        <div class="badges">

    
        <div class="course-meta">
            <span>{data.course.category}</span>
            <span>{data.course.ects ?? '—'} ECTS</span>
        </div>
        </div>

        <h1>{data.course.title}</h1>

        {#if data.course.courseUrl}
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
            <a class="tum-button" href={data.course.courseUrl} target="_blank" rel="noopener noreferrer">
                Open in TUMonline ↗
            </a>
        {/if}
        <SaveCourseButton
            course={{
                id: data.course.id,
                title: data.course.title,
                ects: data.course.ects ?? null
            }}
            {store}
        />
    </header>
    <div class="info-grid">
        {#each sections as section (section.key)}
            {#if data.course[section.key]}
                <section class:wide={section.key === 'content' || section.key === 'teachingMethod'}>
                    <h2>{section.title}</h2>
                    <p class="description">{data.course[section.key]}</p>
                </section>
            {/if}
        {/each}

        {#if !sections.some((section) => data.course[section.key]?.trim())}
            <p>No description available.</p>
        {/if}
    </div>
</main>

<style>
    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px;
    }

    h1 {
        margin-top: 24px;
    }

    section {
        margin-top: 32px;
    }
    
    section h2 {
        margin: 0 0 8px;
        
    }

    .description {
        white-space: pre-wrap; /* Определяет, как отображаются пробелы и переносы строк в тексте. */
        line-height: 1.7;
        margin: 0;
    }
    .back-button {
        display: inline-block;
        padding: 8px 12px;

        text-decoration: none; /* Убираем подчеркивание */
        
        border: 1px solid;
        border-radius: 8px;

        color: #8566a7;
        background: transparent; /*нет собственного цвета фона*/

        
        font-weight: 700;

        transition: /* плавный переход для фона и цвета текста */
            background 0.15s ease,
            color 0.15s ease;
    }

    .back-button:hover {
        background: #8566a7;
        color: white;
    }

    .tum-button {
        display: inline-block;
        padding: 8px 12px;

        text-decoration: none;
        
        border: 1px solid #8566a7;
        border-radius: 7px;

        background: #8566a7;
        color: white;

        font-size: 14px;
        font-weight: 600;

        transition:
            background 0.15s ease,
            border-color 0.15s ease;
    }
    

    .tum-button:hover {
        background: #755895;
        border-color: #755895;
    }

    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 40px; /* 28px между рядами 40px между колонками */
    }
    .wide {
        grid-column: 1 / -1;
    }

    .course-meta {
        display: flex;
        gap: 12px;
        margin: 16px 0;
    }
</style>