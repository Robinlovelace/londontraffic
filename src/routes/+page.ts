import type { PageLoad } from './$types';
import { getRegions } from '$lib/api';

// London first, then the rest alphabetically.
const ORDER: Record<string, number> = { gor_london: 0 };

export const load: PageLoad = async ({ fetch }) => {
  try {
    const regions = await getRegions(fetch);
    regions.sort((a, b) => (ORDER[a.region_id] ?? 1) - (ORDER[b.region_id] ?? 1) || (a.name ?? '').localeCompare(b.name ?? ''));
    return { regions, status: 'ok' as const };
  } catch (e) {
    console.error('Failed to fetch regions:', e);
    return { regions: [], status: 'error' as const };
  }
};
