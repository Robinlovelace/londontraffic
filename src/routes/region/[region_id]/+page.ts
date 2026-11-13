import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getRegions, getRegionManifest, displayName } from '$lib/api';

export const load: PageLoad = async ({ fetch, params }) => {
  try {
    const [regions, manifest] = await Promise.all([
      getRegions(fetch),
      getRegionManifest(params.region_id, fetch),
    ]);

    return {
      regionName: displayName(regions.find((r) => r.region_id === params.region_id)?.name ?? params.region_id),
      manifest,
    };
  } catch (e) {
    console.error('Failed to load region data:', e);
    throw error(404, `Region '${params.region_id}' was not found or its data could not be read. ${e instanceof Error ? e.message : ''}`);
  }
};
