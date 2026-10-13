<script lang="ts">
    import { getContext } from 'svelte';
    import type { SavedCoursesStore } from '$lib/savedCourses.svelte';
    import { resolve } from '$app/paths';

    const store = getContext<SavedCoursesStore>('savedCourses');
    
</script>

<main class="my-courses">
    <h1>My courses</h1>

    <div class="course-meta">
        <span>Saved courses: {store.courses.length}</span>
        <span>Total ECTS: {store.totalEcts}</span>
    </div>

    {#if !store.initialized}
        <p>Loading saved courses...</p>
    {:else if store.courses.length === 0}
        <p>There are no saved courses.</p>
    {:else}
        <table id="courses-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th class="ects-column">ECTS</th>
                    <th>Action</th>
                </tr>
            </thead>

            <tbody>
                {#each store.courses as course (course.id)}
                    <tr>
                        
                        
                        <td class="course-title-cell">
                            <a class="course-title" href={resolve(`/courses/${course.id}?from=saved`)}>
                                {course.title}
                            </a>
                        </td>
                        <td class="course-ects">{course.ects ?? '-'}</td>
                        <td>
                            <button
                                type="button"
                                onclick={() => store.removeCourse(course.id)}
                            >
                                Remove
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</main>

<style>
    .my-courses {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px 32px;
    }

    .my-courses h1 {
        max-width: none;
        margin: 12px 0 24px;
    }

    .course-meta {
        display: flex;
        gap: 24px;
        margin: 0 0 28px;
        font-weight: 600;
    }

    .my-courses table {
        width: 100%;
        max-width: none;
        margin: 0;
    }
</style>