<script lang="ts">
    import { SavedCoursesStore } from "$lib/savedCourses.svelte";
    import { type SavedCourse } from "$lib/types/savedCourse";

    let { course, store }: {
        course: SavedCourse;
        store: SavedCoursesStore;
    } = $props();

    let saved = $derived(store.isSaved(course.id));

    function toggleSave() {
        if (saved) {
            store.removeCourse(course.id);
        }
        else {
            store.addCourse(course);
        }
    }

</script>

<button
    type="button"
    disabled={!store.initialized}
        onclick={toggleSave}
>
    {saved ? 'Saved' : 'Save'}
</button>