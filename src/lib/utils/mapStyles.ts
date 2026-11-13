// Map styling for londontraffic, slimmed from the csis dashboard's mapStyles:
// one layer (links), coloured by car or heavy vehicle AADT. The colour ramp
// and palette are the csis predictions ramp, with a heavy-vehicle scale that
// matches that mode's much lower volumes.

import { CONTRACT_MODE } from "$lib/contract";

/** Volume breaks per mode. Zero-flow links are pale grey; null reads as 0. */
export const AADT_STEPS: Record<string, number[]> = {
  car: [100, 1000, 2000, 4000, 10000],
  heavy: [10, 50, 100, 250, 1000],
};
export const AADT_COLORS = ["#22c55e", "#eab308", "#ea580c", "#dc2626", "#7f1d1d", "#450a0a"];
export const AADT_ZERO_COLOR = "#d4d4d8";

/** The map's per-carriageway flow for a mode; "all" sums the two motor modes. */
export const getAadtValueExpression = (m: string): any =>
  CONTRACT_MODE[m]
    ? ["to-number", ["coalesce", ["get", `aadt_${CONTRACT_MODE[m]}`], 0], 0]
    : ["+", ...Object.values(CONTRACT_MODE).map((c) => ["to-number", ["coalesce", ["get", `aadt_${c}`], 0], 0])];

export const getAADTColorExpression = (m: string): any => {
  const val = getAadtValueExpression(m);
  const steps = AADT_STEPS[m] ?? AADT_STEPS.car;
  // Highest step first, so the largest breaks win the case expression.
  const out: any[] = ["case", ["<=", val, 0], AADT_ZERO_COLOR];
  for (let i = steps.length - 1; i >= 0; i--) {
    out.push([">", val, steps[i]], AADT_COLORS[steps.length - 1 - i]);
  }
  out.push(AADT_COLORS[AADT_COLORS.length - 1]);
  return out;
};

export const lineWidthExpression: any = [
  "interpolate", ["linear"], ["zoom"],
  8, 1,
  11, 2,
  14, 5,
  16, 9,
];
