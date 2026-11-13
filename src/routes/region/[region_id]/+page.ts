import type { PageLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { getRegions, getRegionManifest, displayName } from '$lib/api';
import { SCOPE } from '$lib/scope';

export const load: PageLoad = async ({ fetch, params }) => {
  // Single-page London deployment: the map lives at '/', so /region/<id>
  // just hands over to it.
  if (SCOPE === 'london') {
    redirect(307, `${base}/`);
  }

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
