<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import { SavedCoursesStore } from '$lib/savedCourses.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import "../app.css";
	import favicon from '$lib/assets/favicon.svg';

	const store = new SavedCoursesStore();

	setContext('savedCourses', store);

	onMount(() => store.load())

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>


<nav class="main-nav">
    {#if page.url.pathname !== resolve('/')}
        <a href={resolve('/')}>Course List</a>
    {/if}

    {#if page.url.pathname !== resolve('/my-courses')}
        <a href={resolve('/my-courses')}>My Courses</a>
    {/if}
</nav>

<style>
	.main-nav {
		max-width: 1500px;
		margin: 0 auto;
		padding: 20px 32px;

		display: flex;
		justify-content: flex-end; /*Определяет, как элементы располагаются вдоль главной оси контейнера. */
		gap: 12px;
	}

	.main-nav a {
		padding: 9px 16px;
		border: 1px solid #8566a7;
		border-radius: 8px;
		color: #8566a7;
		text-decoration: none;
		font-weight: 600;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.main-nav a:hover {
		background: #8566a7;
		color: white;
	}
</style>

{@render children()}
