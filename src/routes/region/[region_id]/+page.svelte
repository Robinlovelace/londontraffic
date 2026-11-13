<script lang="ts">
  import RegionDashboard from '$lib/components/RegionDashboard.svelte';
  import { bboxBounds, bboxCenter, bboxZoom } from '$lib/utils/fit';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const regionId = $derived(data.manifest.authority.id);
  const regionName = $derived(data.regionName);
  const bbox = $derived(data.manifest.bbox);
</script>

<svelte:head>
  <title>{regionName} | London Traffic</title>
</svelte:head>

<RegionDashboard
  regionId={regionId}
  regionName={regionName}
  initialCenter={bbox ? bboxCenter(bbox) : undefined}
  initialZoom={bbox ? bboxZoom(bbox) : 11}
  tileVersion={data.manifest?.generated_at}
  manifest={data.manifest}
  regionBounds={bbox ? bboxBounds(bbox) : null}
/>
