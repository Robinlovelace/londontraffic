<script lang="ts">
  // Mode selector: all motor traffic, cars, or heavy vehicles.
  let { value = $bindable('all') } = $props<{ value: string }>();

  let showInfo = $state(false);

  const modes = [
    { id: 'all', name: 'All motor traffic' },
    { id: 'car', name: 'Cars' },
    { id: 'heavy', name: 'Heavy vehicles' },
  ];
  $effect(() => { if (!modes.some((m) => m.id === value)) value = 'all'; });
</script>

<div class="space-y-2">
  <div class="flex items-center gap-1.5">
    <label for="mode-select" class="block text-sm font-medium text-gray-700">Mode</label>
    <div class="relative">
      <button
        class="rounded-full border border-gray-200 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 hover:bg-gray-100"
        onmouseenter={() => (showInfo = true)}
        onmouseleave={() => (showInfo = false)}
        onfocus={() => (showInfo = true)}
        onblur={() => (showInfo = false)}
        aria-label="Show heavy-vehicle definition caveat"
      >
        i
      </button>
      {#if showInfo}
        <div class="absolute left-0 top-6 z-20 w-64 rounded border border-gray-200 bg-white p-2 text-[9px] leading-tight text-gray-600 shadow-lg">
          <p>
            Heavy vehicles: HGVs, buses and coaches, bigger than vans.
            Modelled volumes separate vans from larger vehicles using DfT
            Open Roads and OSM vehicle tags.
          </p>
        </div>
      {/if}
    </div>
  </div>
  <select
    id="mode-select"
    bind:value
    class="w-full truncate rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
  >
    {#each modes as mode}
      <option value={mode.id}>{mode.name}</option>
    {/each}
  </select>
</div>
