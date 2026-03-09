export const checkIfZipStatusReady = data => data.status === 'Zip File Ready.';

export const getMedian = (arr) => {
  arr = arr.slice(0); // create copy
  const middle = (arr.length + 1) / 2;
  const sorted = arr.sort((a, b) => a - b);
  return (sorted.length % 2) ? sorted[middle - 1] : (sorted[middle - 1.5] + sorted[middle - 0.5]) / 2;
};

export const getOfflineMapTitle = (map) => {
  if (!map.name) return map.id;
  return map.name;
};

// borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
export const tile2lat = (y, z) => {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
};

// borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
export const tile2long = (x, z) => x / Math.pow(2, z) * 360 - 180;
