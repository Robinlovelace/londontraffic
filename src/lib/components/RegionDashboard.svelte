<script lang="ts">
  // Region view: sidebar (mode, search) + map of car and heavy AADT. Slimmed
  // from the csis dashboard's RegionDashboard: traffic predictions only.
  import SensorMap from "$lib/components/SensorMap.svelte";
  import ModeSelector from "$lib/components/ModeSelector.svelte";
  import Geocoder from "$lib/components/Geocoder.svelte";
  import { Link } from "lucide-svelte";
  import TwoColumnLayout from "$lib/layouts/TwoColumnLayout.svelte";
  import { replaceState } from "$app/navigation";
  import { base } from "$app/paths";
  import { getRegionTilesBaseUrl } from "$lib/api";
  import { MODE_ALIASES, type Manifest } from "$lib/contract";
  import { SCOPE } from "$lib/scope";

  let { regionId, regionName, initialCenter = [-0.1276, 51.5072], initialZoom = 11, tileVersion, regionBounds = null, manifest } = $props<{ regionId: string; regionName: string; initialCenter?: [number, number]; initialZoom?: number; tileVersion?: string; regionBounds?: [[number, number], [number, number]] | null; manifest: Manifest }>();

  const initParams = typeof window !== "undefined" ? new URL(window.location.href).searchParams : new URLSearchParams();
  // A shared/deep-linked URL carries an explicit position; region auto-fit
  // must not override it.
  const hasUrlPosition = initParams.has("lng") || initParams.has("lat") || initParams.has("z");

  const modeParam = initParams.get("mode") || "all";
  let mode = $state(MODE_ALIASES[modeParam] ?? modeParam);
  let mapCenter = $state<[number, number]>([
    parseFloat(initParams.get("lng") || String(initialCenter[0])),
    parseFloat(initParams.get("lat") || String(initialCenter[1])),
  ]);
  let mapZoom = $state(parseFloat(initParams.get("z") || String(initialZoom)));
  let currentZoom = $state(parseFloat(initParams.get("z") || String(initialZoom)));
  $effect(() => { currentZoom = mapZoom; });
  let nameFilter = $state(initParams.get("q") ?? ""), copied = $state(false);

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); copied = true; setTimeout(() => (copied = false), 2000); } catch { /* clipboard blocked */ }
  }

  function handleBoundsChange(_bounds: any, center: [number, number], zoom: number) { mapCenter = center; currentZoom = zoom; syncUrlState(); }

  let urlSyncTimer: ReturnType<typeof setTimeout> | undefined;
  function syncUrlState() {
    if (typeof window === "undefined") return;
    if (urlSyncTimer) clearTimeout(urlSyncTimer);
    urlSyncTimer = setTimeout(() => {
      const p = new URLSearchParams();
      p.set("lat", mapCenter[1].toFixed(4));
      p.set("lng", mapCenter[0].toFixed(4));
      p.set("z", currentZoom.toFixed(1));
      p.set("mode", mode);
      if (nameFilter.trim()) p.set("q", nameFilter.trim());
      replaceState(`?${p.toString()}`, {});
    }, 400);
  }
  $effect(() => {
    const _ = [mode, regionId, nameFilter];
    syncUrlState();
  });
</script>

<TwoColumnLayout>
  {#snippet sidebar()}
    <div class="flex min-h-full flex-col">
      <div class="flex-1 space-y-6">
        <div class="space-y-1">
          <div class="flex items-center justify-between gap-2 text-sm">
            {#if SCOPE === "national"}
              <a href="{base}/" class="font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap">← All regions</a>
            {:else}
              <span class="text-xs text-gray-400">Modelled traffic estimates</span>
            {/if}
            <div class="flex items-center gap-1.5">
              <button type="button" onclick={copyLink} title="Copy link to this view" aria-label="Copy link to this view" data-testid="copy-link" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-600 hover:border-blue-300 hover:text-blue-600">
                {#if copied}<span class="text-green-600 text-xs">✓</span>{:else}<Link size={14} />{/if}
              </button>
              <a href="{base}/about/" data-testid="about-link" class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600">About</a>
            </div>
          </div>
          <h1 class="text-base font-semibold text-gray-900 break-words">{regionName}</h1>
        </div>

        <div class="space-y-4">
          <Geocoder regionBounds={regionBounds} onSelect={(lng, lat) => { mapCenter = [lng, lat]; mapZoom = currentZoom = 14; syncUrlState(); }} />
          <ModeSelector bind:value={mode} />
          <div class="space-y-1">
            <label for="name-filter" class="block text-sm font-medium text-gray-700">Road name or number</label>
            <input id="name-filter" type="search" bind:value={nameFilter} placeholder="e.g. A40 or Edgware Road" class="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div class="flex-shrink-0 sticky bottom-0 bg-white pt-3 -mx-6 px-6 border-t border-gray-200">
        <p class="text-xs text-gray-400 pt-0.5">London Traffic {__RELEASE_TAG__}</p>
        <p class="text-xs text-gray-400 pt-1">Modelled traffic estimates, by <a href="https://www.leeds.ac.uk" target="_blank" rel="noopener noreferrer" class="hover:text-gray-600 hover:underline">University of Leeds</a></p>
      </div>
    </div>
  {/snippet}

  {#snippet main()}
    <SensorMap
      tilesBaseUrl={getRegionTilesBaseUrl(regionId)}
      {tileVersion}
      {mode}
      {nameFilter}
      {manifest}
      onBoundsChange={handleBoundsChange}
      center={mapCenter}
      zoom={mapZoom}
      regionBounds={hasUrlPosition ? null : regionBounds}
    />
  {/snippet}
</TwoColumnLayout>
