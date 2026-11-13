<script lang="ts">
  // Legend for the AADT colour ramp. Single ramp following the active mode's
  // breaks (simplified from one scale per mode stacked in the "all" view).
  import { AADT_STEPS, AADT_COLORS, AADT_ZERO_COLOR } from "$lib/utils/mapStyles";

  let { mode = "all" } = $props<{ mode?: string }>();

  const steps = $derived(AADT_STEPS[mode] ?? AADT_STEPS.car);
</script>

<div class="pointer-events-none absolute bottom-16 left-2 z-10 max-w-[16rem] rounded-lg bg-white/95 p-2.5 shadow-lg ring-1 ring-gray-200" data-testid="map-legend">
  <p class="text-[10px] font-bold uppercase tracking-wide text-gray-500">Vehicles per day</p>
  <div class="mt-1 flex overflow-hidden rounded">
    {#each Array(steps.length + 1) as _, i (i)}
      <div class="h-2.5 flex-1" style={`background:${AADT_COLORS[i]}`}></div>
    {/each}
  </div>
  <div class="mt-0.5 flex justify-between text-[9px] text-gray-500">
    <span>0</span>
    {#each steps as s (s)}<span>{s.toLocaleString()}</span>{/each}
  </div>
  <p class="mt-1.5 border-t border-gray-100 pt-1 text-[9px] text-gray-400">
    <span class="mr-1 inline-block h-2 w-2 align-middle rounded-sm" style={`background:${AADT_ZERO_COLOR}`}></span>
    no or negligible flow &middot; estimates per carriageway
  </p>
</div>
