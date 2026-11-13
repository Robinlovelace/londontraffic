// The csis published contract (0.3), slimmed for londontraffic: only the links
// layer, with car and heavy vehicle AADT.

export const SUPPORTED_CONTRACT = "0.3";

export type ModeQuality = { level_credible: boolean; level_note: string | null };
export type Layer = {
  file: string;
  rows: number;
  csis_commit: string;
  attribution: string[];
  licences: string[];
  quality?: { modes?: Record<string, ModeQuality>; [k: string]: unknown };
  tiles: { file: string; layer: string; minzoom: number; maxzoom: number; size_bytes?: number };
};
export type Manifest = {
  contract_version: string;
  generated_at: string;
  csis_commit: string;
  authority: { id: string; parent_lad?: string; parent_lta?: string };
  bbox: [number, number, number, number];
  sources: Record<string, { name: string; vintage: string; licence: string; attribution: string }>;
  layers: Record<string, Layer>;
};
export type IndexEntry = { id: string; name: string; bbox: [number, number, number, number]; contract_version: string };

export function contractError(version: string | undefined): string | null {
  const got = (version ?? "none").split(".").slice(0, 2).join(".");
  return got === SUPPORTED_CONTRACT ? null : `This data uses contract ${version ?? "(missing)"}. The app reads contract ${SUPPORTED_CONTRACT}.x.`;
}

// Dashboard mode ids on the links layer: car and heavy vehicles only.
export const CONTRACT_MODE: Record<string, string> = { car: "car", heavy: "heavy" };
// Accepted ?mode= aliases.
export const MODE_ALIASES: Record<string, string> = { vehicles: "heavy" };

const PLAIN_CLASSES = ["motorway", "track", "cycleway", "path", "connector"];
/** A link's popup title: "Roundhay Road (A58)", the name or number alone, else its class. */
export function linkName(p: Record<string, any>): string | null {
  if (p.road_class == null) return null;
  const [name, ref] = [p.road_name, p.road_ref];
  if (name && ref) return `${name} (${ref})`;
  const c = PLAIN_CLASSES.includes(p.road_class) ? p.road_class : `${p.road_class} road`;
  return name ?? ref ?? `Unnamed ${c}`;
}

/**
 * The two flows a link popup shows, preferring the two-carriageway totals the
 * pipeline publishes next to the per-carriageway values. `aadt_<mode>` stays
 * the per carriageway flow on the map.
 */
export function linkFlows(p: Record<string, any>): { car: number | null; heavy: number | null; paired: boolean } {
  const paired = p.aadt_2way_car != null && p.aadt_car != null && p.aadt_2way_car !== p.aadt_car;
  return {
    car: p.aadt_2way_car ?? p.aadt_car ?? null,
    heavy: p.aadt_2way_heavy ?? p.aadt_heavy ?? null,
    paired,
  };
}

/** Filter clause for the road name box: a case-insensitive substring of the road name or number. */
export function nameClause(q: string): any | null {
  const t = q.trim().toLowerCase();
  if (!t) return null;
  const has = (f: string) => ["in", t, ["downcase", ["to-string", ["coalesce", ["get", f], ""]]]];
  return ["any", has("road_name"), has("road_ref")];
}
/** Combine a layer's own filter with the name clause. */
export function withName(base: any, q: string): any {
  const c = nameClause(q);
  return c ? ["all", base ?? ["all"], c] : (base ?? ["all"]);
}
