<script lang="ts">
    let password = $state("");
    let isRefreshing = $state(false);
    let refreshMessage = $state('');

    async function refreshData() {
        isRefreshing = true;
        refreshMessage = '';

        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${password}`
                }
            });

            if (!response.ok) {
                throw new Error('Sync failed');
            }

            refreshMessage = 'Data updated';
        } catch {
            refreshMessage = 'Update failed';
        } finally {
            isRefreshing = false;
        }
    } 

</script>

<h1>Admin</h1>



<div class="updates">
    <input
        name="password"
        type="password"
        bind:value={password}
        placeholder="Admin password"
    />
    <button
        type="button"
        disabled={isRefreshing || !password}
        onclick={refreshData}
    >
        {isRefreshing ? 'Refreshing...' : 'Refresh data'}
    </button>

    {#if refreshMessage}
        <div class="refresh-status">
            {refreshMessage}
        </div>
    {/if}
</div>

<style>

.updates {
    max-width: 1200px;
    margin: 0 auto;

    
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
}

input[name="password"] {
    width: 150px;
    padding: 7px 11px;
    

    border: 1px solid #d7d0df;
    border-radius: 7px;

    font-size: 14px;

    outline: none;

    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

</style>