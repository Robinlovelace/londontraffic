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

  // First non-empty line's midpoint: a vertex along the road, not an endpoint
  // junction or tile-clip edge, with non-finite coordinates rejected.
  const popupCenter = $derived.by(() => {
    const c: any = feature?.geometry?.coordinates;
    const firstFinitePt = (line: any): [number, number] | null => {
      if (!Array.isArray(line)) return null;
      const pt = line[Math.floor(line.length / 2)];
      return Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1]) ? [pt[0], pt[1]] : null;
    };
    if (!Array.isArray(c)) return null;
    if (typeof c[0] === "number" && Number.isFinite(c[0]) && Number.isFinite(c[1])) return [c[0], c[1]] as [number, number];
    // MultiLineString: pick the first sub-line with points.
    if (Array.isArray(c[0]?.[0]?.[0])) {
      for (const part of c) {
        const pt = firstFinitePt(part);
        if (pt) return pt;
      }
      return null;
    }
    return firstFinitePt(c);
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
  {#if popupCenter && detailLevel === "full"}
    <MapButtons center={popupCenter} />
  {/if}
  <p class="mt-1.5 border-t border-gray-100 pt-1 text-[9px] text-gray-400 leading-snug">
    Modelled AADT estimates, not counts.
  </p>
</div>
