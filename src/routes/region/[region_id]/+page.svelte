<script lang="ts">
  import RegionDashboard from '$lib/components/RegionDashboard.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const regionId = $derived(data.manifest.authority.id);
  const regionName = $derived(data.regionName);
  const bbox = $derived(data.manifest.bbox);
  const tileVersion = $derived(data.manifest?.generated_at);
  const center = $derived(
    bbox ? [((bbox[0] + bbox[2]) / 2), ((bbox[1] + bbox[3]) / 2)] as [number, number] : undefined,
  );
  const regionBounds = $derived(
    bbox ? [[bbox[0], bbox[1]], [bbox[2], bbox[3]]] as [[number, number], [number, number]] : null,
  );

  // A single fixed zoom doesn't fit every region: bbox extents vary a lot,
  // so derive zoom from the bbox's actual extent, correcting the longitude
  // degree width by latitude (1 deg lng is narrower than 1 deg lat away from
  // the equator).
  const zoom = $derived.by(() => {
    if (!bbox) return 11;
    const [minx, miny, maxx, maxy] = bbox;
    const lngExtent = maxx - minx;
    const latExtent = maxy - miny;
    const latRad = ((miny + maxy) / 2) * Math.PI / 180;
    const lngExtentCorrected = lngExtent * Math.cos(latRad);
    const maxExtent = Math.max(lngExtentCorrected, latExtent) * 1.3; // padding
    const assumedViewportPx = 800;
    const z = Math.log2((360 * assumedViewportPx) / (256 * maxExtent));
    return Math.max(6, Math.min(15, z));
  });
</script>

<svelte:head>
  <title>{regionName} | London Traffic</title>
</svelte:head>

<RegionDashboard
  regionId={regionId}
  regionName={regionName}
  initialCenter={center}
  initialZoom={zoom}
  tileVersion={tileVersion}
  manifest={data.manifest}
  {regionBounds}
/>
