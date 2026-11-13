<script lang="ts">
  // The map. Slimmed from the csis dashboard's SensorMap: one links layer,
  // basemap switcher, data vintage info, popup, legend.
  import { MapLibre, NavigationControl, GeolocateControl, Popup, ScaleControl } from "svelte-maplibre-gl";
  import maplibregl from "maplibre-gl";
  import { Protocol } from "pmtiles";
  import "maplibre-gl/dist/maplibre-gl.css";
  import PopupContent from "./PopupContent.svelte";
  import MapLegend from "./MapLegend.svelte";
  import OnboardingHint from "./OnboardingHint.svelte";
  import TrafficLayers from "./layers/TrafficLayers.svelte";
  import { Layers, Info } from "lucide-svelte";
  import type { Manifest } from "$lib/contract";

  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  let {
    tilesBaseUrl,
    tileVersion = "",
    mode = "all",
    nameFilter = "",
    onBoundsChange,
    center = [-0.1276, 51.5072],
    zoom = 11,
    regionBounds = null,
    manifest,
  } = $props<{
    tilesBaseUrl: string;
    tileVersion?: string;
    mode?: string;
    nameFilter?: string;
    onBoundsChange?: (bounds: any, center: [number, number], zoom: number) => void;
    center?: [number, number];
    zoom?: number;
    regionBounds?: [[number, number], [number, number]] | null;
    manifest: Manifest;
  }>();

  let map: maplibregl.Map | undefined = $state.raw(),
    hoveredFeature: any = $state.raw(),
    clickedFeature: any = $state.raw(),
    popupLngLat = $state.raw(new maplibregl.LngLat(0, 0)),
    layerClickHandled = false,
    currentZoom = $state(11),
    baseMap = $state<BasemapId>("positron"),
    basemapMenuOpen = $state(false),
    basemapInfoOpen = $state(false),
    geoMessage = $state<string | null>(null),
    tilesLoading = $state(false);

  type BasemapId = "positron" | "satellite" | "transit" | "cycle";
  const rasterStyle = (tiles: string[], attribution: string, maxzoom: number) =>
    ({ version: 8, sources: { base: { type: "raster", tiles, tileSize: 256, attribution, maxzoom } }, layers: [{ id: "base", type: "raster", source: "base" }] });
  const BASEMAPS: Record<BasemapId, { label: string; style: any; description: string; legendUrl?: string }> = {
    positron: { label: "Street", description: "CartoDB Positron style, a clean light basemap", style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
    satellite: { label: "Satellite", description: "Google satellite imagery", style: rasterStyle(["https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"], "&copy; Google", 21) },
    transit: { label: "Transit", description: "OpenStreetMap standard tiles, which show transit routes", legendUrl: "https://openstreetmap.org/", style: rasterStyle(["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', 19) },
    cycle: { label: "Cycle", description: "CyclOSM, a cycle-oriented map with bike lanes and routes", legendUrl: "https://www.cyclosm.org/", style: rasterStyle(["https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", "https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", "https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"], '<a href="https://www.cyclosm.org/">CyclOSM</a> | Tiles: <a href="https://www.openstreetmap.fr/">OSM France</a> | Data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', 19) },
  };
  $effect(() => { currentZoom = zoom; });

  let geoMessageTimeout: ReturnType<typeof setTimeout> | undefined;
  function showGeoMessage(msg: string) {
    geoMessage = msg;
    if (geoMessageTimeout) clearTimeout(geoMessageTimeout);
    geoMessageTimeout = setTimeout(() => (geoMessage = null), 8000);
  }
  function handleGeolocateError(e: GeolocationPositionError) {
    if (e.code === 1) showGeoMessage("Location access denied. Allow location for this site in your browser settings, then try again.");
    else if (e.code === 3) showGeoMessage("Locating timed out. Please try again.");
    else showGeoMessage("Your location could not be determined.");
  }

  function handleMoveEnd() { if (!map) return; const b = map.getBounds(), c = map.getCenter(), z = map.getZoom(); onBoundsChange?.(b, [c.lng, c.lat], z); }
  function handleZoom() { if (map) currentZoom = map.getZoom(); }
  function handleClick() { if (!layerClickHandled) clickedFeature = undefined; layerClickHandled = false; }

  $effect(() => { if (map) { map.on("moveend", handleMoveEnd); map.on("zoom", handleZoom); map.on("click", handleClick); handleMoveEnd(); handleZoom(); return () => { map?.off("moveend", handleMoveEnd); map?.off("zoom", handleZoom); map?.off("click", handleClick); }; } });

  let tilesLoadingTimeout: ReturnType<typeof setTimeout> | undefined;
  function handleDataLoading() {
    tilesLoading = true;
    if (tilesLoadingTimeout) clearTimeout(tilesLoadingTimeout);
    tilesLoadingTimeout = setTimeout(() => (tilesLoading = false), 4000);
  }
  function handleIdle() {
    tilesLoading = false;
    if (tilesLoadingTimeout) clearTimeout(tilesLoadingTimeout);
  }
  $effect(() => {
    if (map) {
      map.on("dataloading", handleDataLoading);
      map.on("idle", handleIdle);
      map.on("error", handleIdle);
      return () => {
        map?.off("dataloading", handleDataLoading);
        map?.off("idle", handleIdle);
        map?.off("error", handleIdle);
        if (tilesLoadingTimeout) clearTimeout(tilesLoadingTimeout);
      };
    }
  });

  function handleLayerMouseMove(e: any) {
    if (!clickedFeature) {
      hoveredFeature = e.features?.[0];
      popupLngLat = e.lngLat;
    }
    if (map) map.getCanvas().style.cursor = "pointer";
  }
  function handleLayerMouseLeave(e: any) {
    if (!clickedFeature) hoveredFeature = undefined;
    if (map) map.getCanvas().style.cursor = "";
  }
  function handleLayerClick(e: any) {
    layerClickHandled = true;
    clickedFeature = e.features?.[0];
    popupLngLat = e.lngLat;
    hoveredFeature = undefined;
  }

  // Fit to bounds on initial navigation
  let hasFittedBounds = $state(false);
  $effect(() => {
    if (map && regionBounds && !hasFittedBounds) {
      const m = map;
      const fn = () => {
        m.fitBounds(regionBounds, { padding: 50, maxZoom: 14, duration: 1000 });
        hasFittedBounds = true;
      };
      if (m.loaded()) {
        fn();
      } else {
        m.once("load", fn);
        return () => m.off("load", fn);
      }
    }
  });

  const vintageRows = $derived.by(() => {
    const s = (manifest as any)?.sources;
    const r: [string, string][] = [];
    if (s?.osm?.vintage) r.push(["OpenStreetMap", String(s.osm.vintage)]);
    if (s?.os_open_roads?.vintage) r.push(["OS Open Roads", String(s.os_open_roads.vintage)]);
    if (manifest?.generated_at) r.push(["Model build date", String(manifest.generated_at).slice(0, 10)]);
    return r;
  });

</script>

<svelte:window onkeydown={(e) => { if (e.key === "Escape") { basemapMenuOpen = false; basemapInfoOpen = false; } }} />

<div class="h-full w-full relative">
  <MapLibre bind:map style={BASEMAPS[baseMap].style} {center} {zoom} maxZoom={24} attributionControl={false} class="h-full w-full">
    <NavigationControl position="top-right" />
    <GeolocateControl
      position="top-right"
      positionOptions={{ enableHighAccuracy: true }}
      trackUserLocation={false}
      onerror={handleGeolocateError}
    />
    <ScaleControl position="bottom-left" />
    <TrafficLayers {mode} {tilesBaseUrl} {tileVersion} {nameFilter} onMouseMove={handleLayerMouseMove} onMouseLeave={handleLayerMouseLeave} onClick={handleLayerClick} />
    {#if (clickedFeature || hoveredFeature)?.geometry}
      <Popup lnglat={popupLngLat} focusAfterOpen={false} closeButton={!!clickedFeature} closeOnClick={false} onclose={() => clickedFeature = undefined} class="text-black {hoveredFeature && !clickedFeature ? 'pointer-events-none' : ''}">
        <PopupContent feature={clickedFeature || hoveredFeature} {mode} detailLevel={clickedFeature ? "full" : "minimal"} />
      </Popup>
    {/if}
  </MapLibre>
  {#if basemapMenuOpen}
    <div class="fixed inset-0 z-10" onclick={() => basemapMenuOpen = false} aria-hidden="true"></div>
    <div class="absolute bottom-[5.5rem] left-2 z-20 rounded-lg bg-white shadow-lg ring-1 ring-gray-200 py-1 min-w-[7rem]" role="menu">
      {#each Object.entries(BASEMAPS) as [id, bm]}
        <button
          onclick={() => { baseMap = id as BasemapId; basemapMenuOpen = false; }}
          role="menuitemradio"
          aria-checked={baseMap === id}
          class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-100
                 {baseMap === id ? 'font-semibold text-blue-700' : 'text-gray-700'}"
        >
          <span class="h-1.5 w-1.5 rounded-full {baseMap === id ? 'bg-blue-600' : 'bg-transparent'}"></span>
          {bm.label}
        </button>
      {/each}
    </div>
  {/if}
  <button
    onclick={() => { basemapMenuOpen = !basemapMenuOpen; basemapInfoOpen = false; }}
    title="Change basemap"
    aria-label="Change basemap"
    aria-expanded={basemapMenuOpen}
    class="absolute bottom-12 left-2 z-20 flex h-9 w-9 items-center justify-center rounded-lg
           bg-white text-gray-700 shadow-lg ring-1 ring-gray-200 hover:bg-gray-50"
  >
    <Layers size={18} />
  </button>
  {#if basemapInfoOpen}
    <div class="fixed inset-0 z-10" onclick={() => basemapInfoOpen = false} aria-hidden="true"></div>
    <div class="absolute bottom-12 right-2 z-30 w-80 max-w-[calc(100vw-1rem)] rounded-lg bg-white shadow-lg ring-1 ring-gray-200 p-3 text-xs text-gray-700 space-y-2.5" role="dialog" aria-label="Data vintage and basemap information">
      {#if vintageRows.length}
        <div>
          <p class="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">Data vintage</p>
          <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
            {#each vintageRows as [k, v] (k)}
              <div class="text-gray-600">{k}</div>
              <div class="text-right font-medium text-gray-900">{v}</div>
            {/each}
          </div>
        </div>
      {/if}
      <details class="border-t border-gray-100 pt-2 text-[11px]">
        <summary class="cursor-pointer select-none font-semibold text-gray-900">Basemap: {BASEMAPS[baseMap].label}</summary>
        <ul class="mt-1.5 space-y-1 text-gray-600">
          {#each Object.entries(BASEMAPS) as [id, bm]}
            <li>
              <span class="font-medium {baseMap === id ? 'text-blue-700' : 'text-gray-900'}">{bm.label}:</span>
              {bm.description}{#if bm.legendUrl}
                <a href={bm.legendUrl} target="_blank" rel="noopener noreferrer" class="ml-1 text-blue-600 hover:underline">See legend</a>
              {/if}
            </li>
          {/each}
        </ul>
      </details>
      <p class="border-t border-gray-100 pt-1.5 text-[10px] text-gray-400 leading-snug">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="hover:underline">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer" class="hover:underline">CARTO</a> · Contains OS data © Crown copyright
      </p>
    </div>
  {/if}
  <button
    onclick={() => { basemapInfoOpen = !basemapInfoOpen; basemapMenuOpen = false; }}
    title="Data vintage & map attribution"
    aria-label="Data vintage & map attribution"
    aria-expanded={basemapInfoOpen}
    class="absolute bottom-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full
           bg-white/95 text-gray-700 shadow-md ring-1 ring-gray-200 hover:bg-gray-50"
  >
    <Info size={15} />
  </button>
  {#if geoMessage}
    <div class="absolute top-2 left-1/2 -translate-x-1/2 z-30 max-w-[90%] rounded-lg bg-gray-900/90 px-3 py-2 text-xs text-white shadow-lg" role="status">
      {geoMessage}
    </div>
  {/if}
  <MapLegend {mode} />
  <OnboardingHint source="links" />
  {#if tilesLoading}
    <div class="absolute top-0 left-0 right-0 z-20 h-[3px] bg-blue-600 animate-pulse"></div>
  {/if}
</div>
