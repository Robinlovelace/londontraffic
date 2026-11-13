<script lang="ts">
  /**
   * Reusable Street View + OpenStreetMap button pair for map feature popups.
   * Pass `center` as [lon, lat] from the feature geometry. Ported from the
   * csis dashboard's MapButtons.
   */
  let {
    center = null,
  } = $props<{
    center?: [number, number] | null;
  }>();

  const hasCenter = $derived(
    Array.isArray(center) && center.length === 2 &&
    Number.isFinite(center[0]) && Number.isFinite(center[1])
  );
  const svUrl = $derived(
    hasCenter
      ? `https://maps.google.com/maps?q=&layer=c&cbll=${center[1]},${center[0]}&cbp=11,0,0,0,0`
      : "#"
  );
  const osmUrl = $derived(
    hasCenter
      ? `https://www.openstreetmap.org/#map=19/${center[1]}/${center[0]}`
      : "#"
  );
</script>

{#if hasCenter}
<div class="mt-3 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
  <a
    href={svUrl}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Open in Street View (opens in new tab)"
    class="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 text-[10px] font-medium transition-colors"
  >
    Street View
  </a>
  <a
    href={osmUrl}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Open in OpenStreetMap (opens in new tab)"
    class="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 text-[10px] font-medium transition-colors"
  >
    OpenStreetMap
  </a>
</div>
{/if}
