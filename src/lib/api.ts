/**
 * Static data client, slimmed for londontraffic. The data follows the csis
 * published contract (see contract.ts): `data/index.json` and
 * `data/{id}/manifest.json`, with the PMTiles the manifest lists under
 * `data/{id}/tiles/`.
 */

import { base } from '$app/paths';
import { contractError, type IndexEntry, type Manifest } from '$lib/contract';

export interface Region {
  region_id: string;
  name?: string;
  description?: string;
  bbox?: [number, number, number, number];
}

export type FetchFn = typeof globalThis.fetch;

/** "oxfordshire, Oxfordshire" reads as "Oxfordshire". The index name keeps the id prefix for boundary matching. */
export const displayName = (name = "") => (name.includes(", ") ? name.slice(name.indexOf(", ") + 2) : name);

export async function fetchJson<T>(url: string, customFetch?: FetchFn): Promise<T> {
  const fetchFn = customFetch ?? globalThis.fetch;
  const response = await fetchFn(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function getRegions(fetchFn?: FetchFn): Promise<Region[]> {
  const index = await fetchJson<{ regions?: IndexEntry[] } | IndexEntry[]>(`${base}/data/index.json`, fetchFn);
  const entries: IndexEntry[] = Array.isArray(index) ? index : (index.regions ?? []);
  return entries.map((e) => ({ region_id: e.id, name: e.name, bbox: e.bbox }));
}

export async function getRegionManifest(regionId: string, fetchFn?: FetchFn): Promise<Manifest> {
  const m = await fetchJson<Manifest>(`${base}/data/${encodeURIComponent(regionId)}/manifest.json`, fetchFn);
  const err = contractError(m.contract_version);
  if (err) throw new Error(err);
  return m;
}

/** Base URL for a region's PMTiles layers. */
export function getRegionTilesBaseUrl(regionId: string): string {
  return `${base}/data/${encodeURIComponent(regionId)}/tiles`;
}
