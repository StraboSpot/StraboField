import {CUSTOM_MAP_SOURCES} from '../custom-maps/customMaps.constants';

export const checkIfZipStatusReady = data => data.status === 'Zip File Ready.';

export const getOfflineMapTitle = (map) => {
  if (!map.name) return map.id;
  return map.name;
};

// Cached tiles live in a directory named for the map id — for Mapbox styles the style-id portion only, so a style
// that moves to a different Mapbox account keeps the tiles already on the device.
export const getTileFolderName = (id, source) => source === CUSTOM_MAP_SOURCES.MAPBOX_STYLES && id.includes('/')
  ? id.split('/')[1] : id;

// Where a coordinate falls in the tile grid, kept unrounded: the distance between two of these is an extent
// measured in tiles, which is how far apart they are rather than which tiles they land in.
// borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
export const lat2tileFraction = (lat, z) =>
  (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z);

// borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
export const long2tileFraction = (lon, z) => (lon + 180) / 360 * Math.pow(2, z);

// borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
export const lat2tile = (lat, z) => Math.floor(lat2tileFraction(lat, z));

// borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
export const long2tile = (lon, z) => Math.floor(long2tileFraction(lon, z));

// borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
export const tile2lat = (y, z) => {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
};

// borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
export const tile2long = (x, z) => x / Math.pow(2, z) * 360 - 180;
