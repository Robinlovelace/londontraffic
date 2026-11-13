<script lang="ts">
  // The links PMTiles layer, coloured by car or heavy vehicle AADT. Slimmed
  // from the csis dashboard's TrafficLayers: the predictions layer only.
  import { LineLayer, VectorTileSource } from "svelte-maplibre-gl";
  import { withName } from "$lib/contract";
  import { getAADTColorExpression, lineWidthExpression } from "$lib/utils/mapStyles";

  let {
    showTiles = true,
    mode = "all",
    tilesBaseUrl,
    tileVersion,
    nameFilter = "",
    onMouseMove,
    onMouseLeave,
    onClick,
  } = $props<{
    showTiles?: boolean;
    mode?: string;
    tilesBaseUrl: string;
    tileVersion?: string;
    nameFilter?: string;
    onMouseMove: (e: any) => void;
    onMouseLeave: (e: any) => void;
    onClick: (e: any) => void;
  }>();

  const versionSuffix = $derived(tileVersion ? `?v=${encodeURIComponent(tileVersion)}` : "");
  const linkFilter = $derived(withName(["all"], nameFilter));
</script>

{#if showTiles}
  <VectorTileSource
    id="links-source"
    url={`pmtiles://${tilesBaseUrl}/links.pmtiles${versionSuffix}`}
    maxzoom={16}
    minzoom={8}
  >
    <LineLayer
      id="links-layer"
      sourceLayer="links"
      filter={linkFilter as any}
      paint={{
        "line-color": getAADTColorExpression(mode) as any,
        "line-width": lineWidthExpression as any,
        "line-opacity": 0.95,
      }}
      layout={{ "line-cap": "butt" }}
      onmousemove={onMouseMove}
      onmouseleave={onMouseLeave}
      onclick={onClick}
    />
    <!-- Invisible hit-layer: wider fixed width for easier clicking -->
    <LineLayer
      id="links-hit-layer"
      sourceLayer="links"
      filter={linkFilter as any}
      paint={{ "line-color": "transparent", "line-width": 16, "line-opacity": 0 }}
      onmousemove={onMouseMove}
      onmouseleave={onMouseLeave}
      onclick={onClick}
    />
  </VectorTileSource>
{/if}
