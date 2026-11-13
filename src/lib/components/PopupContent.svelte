<script lang="ts">
  // Link popup: road name, car and heavy vehicle AADT, plus OSM/Street View
  // links (MapButtons, as in the csis dashboard). No safety/infrastructure data.
  import { linkName, linkFlows } from "$lib/contract";
  import MapButtons from "./MapButtons.svelte";

  let { feature, mode = "all", detailLevel = "minimal" } = $props<{
    feature: any;
    mode?: string;
    detailLevel?: "minimal" | "full";
  }>();

  const p = $derived((feature?.properties ?? {}) as Record<string, any>);
  const name = $derived(linkName(p));
  const flows = $derived(linkFlows(p));
  const fmt = (v: number | null) => (v == null ? "No estimate" : Math.round(v).toLocaleString() + " veh/day");
  const lenKm = $derived(p.length_m != null ? (p.length_m / 1000).toFixed(2) + " km" : null);

  // First coordinate of the line geometry, for the OSM / Street View links.
  const popupCenter = $derived.by(() => {
    const c: any = feature?.geometry?.coordinates;
    if (!Array.isArray(c)) return null;
    if (typeof c[0] === "number" && typeof c[1] === "number") return [c[0], c[1]] as [number, number];
    if (Array.isArray(c[0]) && typeof c[0][0] === "number" && typeof c[0][1] === "number") return [c[0][0], c[0][1]] as [number, number];
    if (Array.isArray(c[0]) && Array.isArray(c[0][0]) && typeof c[0][0][0] === "number" && typeof c[0][0][1] === "number") return [c[0][0][0], c[0][0][1]] as [number, number];
    if (Array.isArray(c[0]) && Array.isArray(c[0][0]) && Array.isArray(c[0][0][0]) && typeof c[0][0][0][0] === "number" && typeof c[0][0][0][1] === "number") return [c[0][0][0][0], c[0][0][0][1]] as [number, number];
    return null;
  });
</script>

<div class="max-w-[280px] text-black" data-testid="link-popup">
  <h3 class="text-sm font-semibold text-gray-900">{name ?? "Road link"}</h3>
  <div class="mt-1 space-y-0.5 text-xs text-gray-700">
    <div class="flex justify-between gap-3">
      <span>Cars</span>
      <span class="font-medium text-gray-900">{fmt(flows.car)}</span>
    </div>
    <div class="flex justify-between gap-3">
      <span>Heavy vehicles</span>
      <span class="font-medium text-gray-900">{fmt(flows.heavy)}</span>
    </div>
    {#if flows.paired}
      <p class="text-[10px] text-gray-500">Two-way totals; the map colours each carriageway separately.</p>
    {/if}
    {#if lenKm}
      <div class="flex justify-between gap-3">
        <span>Length</span>
        <span class="font-medium text-gray-900">{lenKm}</span>
      </div>
    {/if}
    {#if p.road_class && detailLevel === "full"}
      <div class="flex justify-between gap-3">
        <span>Class</span>
        <span class="font-medium text-gray-900">{p.road_class}</span>
      </div>
    {/if}
  </div>
  <MapButtons center={popupCenter} />
  <p class="mt-1.5 border-t border-gray-100 pt-1 text-[9px] text-gray-400 leading-snug">
    Modelled AADT estimates, not counts.
  </p>
</div>
