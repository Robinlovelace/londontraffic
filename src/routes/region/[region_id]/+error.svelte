<script lang="ts">
  import { page } from '$app/stores';
  import { ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Region unavailable | Counterflow</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-6 py-10">
  <div class="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
    <h1 class="text-2xl font-bold text-gray-900">Region unavailable</h1>
    <p class="mt-3 text-gray-600">
      {#if $page.error?.message}
        {$page.error.message}
      {:else}
        The region you requested could not be loaded.
      {/if}
    </p>
    <div class="mt-6">
      <a
        href="/"
        class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
      >
        <ArrowLeft size={16} class="mr-2" />
        Back to all regions
      </a>
    </div>
  </div>
</div>
