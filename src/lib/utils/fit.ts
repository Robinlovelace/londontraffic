// Derive a map's initial view from a region bbox. A single fixed zoom doesn't
// fit every region (bbox extents vary a lot), so zoom comes from the bbox's
// actual extent, correcting the longitude degree width by latitude (1 deg lng
// is narrower than 1 deg lat away from the equator).
export const bboxCenter = (bbox: [number, number, number, number]): [number, number] => [
  (bbox[0] + bbox[2]) / 2,
  (bbox[1] + bbox[3]) / 2,
];

export const bboxBounds = (bbox: [number, number, number, number]) =>
  [[bbox[0], bbox[1]], [bbox[2], bbox[3]]] as [[number, number], [number, number]];

export const bboxZoom = (bbox: [number, number, number, number]): number => {
  const [minx, miny, maxx, maxy] = bbox;
  const lngExtent = maxx - minx;
  const latExtent = maxy - miny;
  const latRad = ((miny + maxy) / 2) * Math.PI / 180;
  const lngExtentCorrected = lngExtent * Math.cos(latRad);
  const maxExtent = Math.max(lngExtentCorrected, latExtent) * 1.3; // padding
  const assumedViewportPx = 800;
  const z = Math.log2((360 * assumedViewportPx) / (256 * maxExtent));
  return Math.max(6, Math.min(15, z));
};
