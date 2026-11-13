<script lang="ts">
  import { base } from '$app/paths';
  import { displayName, type Region } from '$lib/api';
  import RegionDashboard from '$lib/components/RegionDashboard.svelte';
  import { SCOPE } from '$lib/scope';
  import { bboxBounds, bboxCenter, bboxZoom } from '$lib/utils/fit';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const regions = $derived((data.regions ?? []) as Region[]);
  const isMapView = $derived(SCOPE === 'london' && data.view === 'map');
  const bbox = $derived((data as any).manifest?.bbox ?? null);
  const title = $derived(
    isMapView
      ? 'London Traffic: modelled car and heavy vehicle AADT'
      : 'London Traffic: national car and heavy vehicle AADT estimates',
  );
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

{#if isMapView && data.manifest}
  <RegionDashboard
    regionId={data.regionId}
    regionName={data.regionName}
    initialCenter={bbox ? bboxCenter(bbox) : undefined}
    initialZoom={bbox ? bboxZoom(bbox) : 11}
    tileVersion={data.manifest?.generated_at}
    manifest={data.manifest}
    regionBounds={bbox ? bboxBounds(bbox) : null}
  />
{:else}
  <div class="min-h-screen bg-gray-50 px-6 py-6">
    <div class="mx-auto max-w-6xl space-y-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">London Traffic: national traffic estimates</h1>
          <p class="mt-1 text-sm text-gray-600">Modelled average daily traffic (AADT) for cars and heavy vehicles on every road link in England. Pick a region to explore:</p>
        </div>
        <a href="https://www.leeds.ac.uk/" target="_blank" rel="noopener noreferrer" class="shrink-0">
          <img src="{base}/university-of-leeds-logo.svg" alt="University of Leeds" class="h-10 w-auto" />
        </a>
      </div>

      <div>
        <a href="{base}/about/" data-testid="landing-about" class="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700">About the estimates</a>
      </div>

      <div class="flex flex-col space-y-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Available Regions</div>
        {#if data.status === 'error'}
          <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div class="font-semibold">Failed to load regions</div>
            <div class="mt-1">The region index may be temporarily unavailable. <a href="{base}/" class="underline hover:text-red-900">Retry</a></div>
          </div>
        {:else if regions.length}
          <div class="grid gap-2 sm:grid-cols-2">
            {#each regions as region (region.region_id)}
              <a
                href="{base}/region/{region.region_id}"
                class="block rounded-xl border border-gray-200 bg-white px-4 py-2.5 transition hover:border-blue-300 hover:shadow-sm"
              >
                <div class="text-sm font-semibold text-gray-900">{displayName(region.name)}</div>
                {#if region.description}
                  <div class="mt-0.5 truncate text-xs text-gray-600">{region.description}</div>
                {/if}
              </a>
            {/each}
          </div>
        {:else}
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No built regions are available yet.
          </div>
        {/if}
      </div>

    </div>
  </div>
{/if}
