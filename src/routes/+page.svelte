<script lang="ts">
    import type { PageProps } from './$types';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import { SvelteURLSearchParams } from 'svelte/reactivity';

    let isRefreshing = $state(false);
    let refreshMessage = $state('');
    let { data }: PageProps = $props();
    
    const ectsOptions = Array.from({ length: 20 }, (_, i) => i + 1); // (_, i) элемент и его индекс
    
    
    let selectedEcts = $state(Number(data.ectsParam ?? 5));
    let categoryTypes = $state(['Practical Course', 'Seminar Course', 'Elective Modules', 'Support Electives', 'Theory Modules']);
    let selectedCourseType = $state(data.categoryParam ?? 'Elective Modules');

    let searchParam = $state(data.searchParam ?? '');

    const currentPage = $derived(data.page ?? 1);
    
    const totalPages = $derived(
    Math.ceil((data.totalCourses ?? 0) / (data.pageSize ?? 20))
    );

    // Тип `/?${string}` — не косметика: resolve() принимает только известный шаблон маршрута.
    function getPageUrl(page: number): `/?${string}` {
        const params = new SvelteURLSearchParams(); // кодирует пробелы и прочие символы в query

        params.set('category_type', selectedCourseType);
        params.set('ects_number', String(selectedEcts));
        params.set('page', String(page));
        
        // Пустую строку и пробелы в URL не кладём: для сервера это то же, что параметра нет.
        if (searchParam.trim()) {
            params.set('search', searchParam);
        }

        return `/?${params.toString()}`;
    }

    async function goNext(page: number) {
        // Делает переход через SvelteKit и сохраняет текущую позицию скролла
        await goto(resolve(getPageUrl(page)), {
            noScroll: true
        });

        document
            .getElementById('courses-table')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' }); // прокрутить чтобы элемент был виден, плавно прокрутить к началу таблицы

    }

    async function goPrevious(page: number) {
        await goto(resolve(getPageUrl(page)), {
            noScroll: true
        });
        
        document
            .getElementById('pagination')
            ?.scrollIntoView({
                behavior: 'auto',
                block: 'end'
            }); // прокрутить чтобы элемент был виден, мгновенно прокрутить к концу таблицы
        
        window.scrollBy({
            top: 80,
            behavior: 'auto'
        }); // прокрутить на 80 пикселей вниз, мгновенно
    }
</script>

<h1>Modules of Master Computer Science</h1> 
<form method="GET" class="search">
    <div class="search-controls">
        <span>WS 26/27 </span>
        <label for="ects">
            Choose number of ECTS:
            <select id="ects" name="ects_number" bind:value={selectedEcts}>
                {#each ectsOptions as ects (ects)}
                    <option value={ects}>{ects}</option>
                {/each}
            </select>
            
        </label>
        <label for="category">
            Choose a category:
            <select id="category" name="category_type" bind:value={selectedCourseType}>
                {#each categoryTypes as courseType (courseType)}
                    <option value={courseType}>{courseType}</option>
                {/each}
            </select>
            
        </label>

        <button type="submit">Search</button>
        <button
        type="button"
        disabled={isRefreshing}
            onclick={async () => {
                isRefreshing = true;
                refreshMessage = '';

                try {
                    const response = await fetch('/api/sync', {
                        method: 'POST'
                    });

                    if (!response.ok) {
                        throw new Error();
                    }

                    refreshMessage = 'Data updated';
                } catch {
                    refreshMessage = 'Update failed';
                } finally {
                    isRefreshing = false;
                }
            }}
        >
            {isRefreshing ? 'Refreshing...' : 'Refresh data'}
        </button>

        <input name="search" placeholder="Search for a course" />
    </div>

    {#if refreshMessage}
        <div class="refresh-status">
            {refreshMessage}
        </div>
    {/if}
</form>

<table id="courses-table">
    <thead>
        <tr>
            <th>Area</th>
            <th>Title</th>
            <th class="ects-column">ECTS</th>
        </tr>
    </thead>

    <tbody>
        {#each data.courses as course (course.tumNodeId)}
            <tr>
                <td>{course.categoryPath ?? '-'}</td>
                <td class="course-title-cell">
                    <a class="course-title" href={resolve(`/courses/${course.id}${page.url.search}`)}>
                        {course.title}
                    </a>
                </td>
                <td class="course-ects">{course.ects ?? '-'}</td>
            </tr>
        {/each}
    </tbody>
</table>
{#if totalPages > 1}
    <div class="pagination" id="pagination">
        {#if currentPage  > 1}
            <a href={resolve(getPageUrl(currentPage  - 1))}
                onclick={(event) => {
                        event.preventDefault();

                        goPrevious(currentPage - 1);
                    }}
            >
                Previous
            </a>
        {/if}

        <span>
            Page {currentPage} of {totalPages}
        </span>

        {#if currentPage  < totalPages}
            <a href={resolve(getPageUrl(currentPage  + 1))}
                onclick={(event) => {
                        // href остаётся настоящей ссылкой (новая вкладка, копирование).
                        // Клик перехватываем, чтобы перейти через goto и прокрутить таблицу самим.
                        event.preventDefault();

                        goNext(currentPage + 1);
                    }}
            >
                Next
            </a>
        {/if}
    </div>
{/if}