<script lang="ts">
  let { onSelect, regionBounds = null } = $props<{
    onSelect: (lng: number, lat: number, name: string) => void;
    regionBounds?: [[number, number], [number, number]] | null;
  }>();

  let query = $state('');
  let results = $state<any[]>([]);
  let loading = $state(false);
  let status = $state('');
  let showDropdown = $state(false);

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let abortController: AbortController | undefined;

  function handleSearch() {
    status = '';
    // Always cancel a pending search first, even when clearing the input.
    if (timeout) clearTimeout(timeout);
    abortController?.abort();
    if (query.length < 3) {
      results = [];
      showDropdown = false;
      return;
    }

    const controller = new AbortController();
    abortController = controller;
    timeout = setTimeout(async () => {
      loading = true;
      try {
        let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=gb`;
        if (regionBounds) {
          // viewbox: left,top,right,bottom (min longitude, max latitude, max longitude, min latitude)
          const [sw, ne] = regionBounds;
          // Add 10km buffer (~0.09 deg lat; ~0.15 deg lng at UK latitudes)
          const latBuf = 0.09;
          const lngBuf = 0.15;
          const vbLeft = sw[0] - lngBuf;
          const vbBottom = sw[1] - latBuf;
          const vbRight = ne[0] + lngBuf;
          const vbTop = ne[1] + latBuf;
          url += `&bounded=1&viewbox=${vbLeft},${vbTop},${vbRight},${vbBottom}`;
        }
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error(`Nominatim responded ${resp.status}`);
        const seen = new Set<string>();
        results = (await resp.json()).filter((r: any) => {
          const key = `${r.display_name}|${Number(r.lat).toFixed(3)}|${Number(r.lon).toFixed(3)}`;
          return !seen.has(key) && !!seen.add(key);
        });
        status = results.length ? '' : 'No places found in this region.';
        showDropdown = results.length > 0;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        status = 'Place search is unavailable. Try again later.';
        console.error('Geocoding error:', e);
      } finally {
        loading = false;
      }
    }, 400);
  }


  function selectLocation(res: any) {
    onSelect(parseFloat(res.lon), parseFloat(res.lat), res.display_name);
    query = res.display_name;
    showDropdown = false;
    results = [];
  }
</script>

<div class="relative w-full">
  <div class="relative">
    <input
      type="text"
      bind:value={query}
      oninput={handleSearch}
      onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' && results.length > 0) selectLocation(results[0]); }}
      placeholder="Search for a place or postcode..."
      aria-label="Search for a location"
      class="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm pr-10"
    />
    <div class="absolute right-3 top-2.5">
      {#if loading}
        <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      {/if}
    </div>
  </div>

  {#if status && !loading}<p class="mt-1 text-xs text-gray-500" role="status">{status}</p>{/if}
  {#if showDropdown}
    <div class="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-sm bg-white/95">
      {#each results as res}
        <button
          onclick={() => selectLocation(res)}
          class="w-full text-left px-4 py-3 text-xs hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex flex-col gap-0.5"
        >
          <span class="font-bold text-gray-900 line-clamp-1">{res.display_name.split(',')[0]}</span>
          <span class="text-gray-500 line-clamp-2">{res.display_name.split(',').slice(1).join(',')}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
