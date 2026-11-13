import type { PageLoad } from './$types';
import { getRegions, getRegionManifest, displayName } from '$lib/api';
import { SCOPE } from '$lib/scope';

// London first, then the rest alphabetically.
const ORDER: Record<string, number> = { gor_london: 0 };

export const load: PageLoad = async ({ fetch }) => {
  // Single-page London deployment: '/' renders the London region map directly.
  if (SCOPE === 'london') {
    try {
      const regions = await getRegions(fetch);
      const region = regions[0];
      if (!region) return { view: 'list' as const, regions: [], status: 'error' as const };
      const manifest = await getRegionManifest(region.region_id, fetch);
      return {
        view: 'map' as const,
        regionId: region.region_id,
        regionName: displayName(region.name),
        manifest,
        status: 'ok' as const,
      };
    } catch (e) {
      console.error('Failed to load region data:', e);
      return { view: 'list' as const, regions: [], status: 'error' as const };
    }
  }

  // National deployment: landing lists the built regions.
  try {
    const regions = await getRegions(fetch);
    regions.sort((a, b) => (ORDER[a.region_id] ?? 1) - (ORDER[b.region_id] ?? 1) || (a.name ?? '').localeCompare(b.name ?? ''));
    return { view: 'list' as const, regions, status: 'ok' as const };
  } catch (e) {
    console.error('Failed to fetch regions:', e);
    return { view: 'list' as const, regions: [], status: 'error' as const };
  }
};
