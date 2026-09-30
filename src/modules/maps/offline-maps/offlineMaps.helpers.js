import {isEmpty} from '../../../shared/helpers';
import {CUSTOM_MAP_SOURCES} from '../custom-maps/customMaps.constants';

export const checkIfZipStatusReady = data => data.status === 'Zip File Ready.';

// Tiles are named z_x_y.png. Anything else sitting in the directory would make every number NaN, so it is left out.
export const parseTileNames = names => names.map(name => name.replace('.png', '').split('_').map(Number))
  .filter(tile => tile.length === 3 && tile.every(Number.isFinite));

// The extent a set of tiles covers. A tile's coordinate is its north west corner, so the south and east edges come
// from the tile after the last one.
export const getTilesBbox = (tiles) => {
  if (isEmpty(tiles)) return;
  // Deeper tiles cover the same ground in more pieces, so past this the extra precision buys nothing
  const zoom = Math.min(Math.max(...tiles.map(([z]) => z)), 14);
  const tilesAtZoom = tiles.filter(([z]) => z === zoom);
  if (isEmpty(tilesAtZoom)) return;
  const xs = tilesAtZoom.map(([, x]) => x);
  const ys = tilesAtZoom.map(([, , y]) => y);
  return [
    tile2long(Math.min(...xs), zoom),
    tile2lat(Math.max(...ys) + 1, zoom),
    tile2long(Math.max(...xs) + 1, zoom),
    tile2lat(Math.min(...ys), zoom),
  ];
};

// What a downloaded map's tile files add up to: how many there are at each zoom, the room they take and the extent
// they cover. Each file is {name, size}.
export const getTileStats = (files) => {
  const tiles = parseTileNames(files.map(file => file.name));
  const zoomCounts = {};
  tiles.forEach(([z]) => {
    zoomCounts[z] = (zoomCounts[z] || 0) + 1;
  });
  return {
    bbox: getTilesBbox(tiles),
    size: files.reduce((total, file) => total + Number(file.size), 0),
    zoomCounts,
  };
};

export const formatTilesSize = (bytes) => {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// The zoom a map sits at once an extent is framed to fill a screen of this size, as zoomToCustomMap does: whole
// zooms only, rounded down so the extent still fits. Mapbox zooms count a 512px world, whatever the tile size.
export const getScreenFitZoom = ([west, south, east, north], width, height) => {
  const worldShareWide = long2tileFraction(east, 0) - long2tileFraction(west, 0);
  const worldShareHigh = lat2tileFraction(south, 0) - lat2tileFraction(north, 0);
  const zoom = Math.log2(Math.min(width / (worldShareWide * 512), height / (worldShareHigh * 512)));
  return Math.max(0, Math.floor(zoom));
};

export const getOfflineMapTitle = (map) => {
  if (!map.name) return map.id;
  return map.name;
};

// Cached tiles live in a directory named for the map id — for Mapbox styles the style-id portion only, so a style
// that moves to a different Mapbox account keeps the tiles already on the device.
export const getTileFolderName = (id, source) => source === CUSTOM_MAP_SOURCES.MAPBOX_STYLES && id.includes('/')
  ? id.split('/')[1] : id;

// The copy of a map downloaded to this device. Keyed by its tile folder, or by its id for a Mapbox style downloaded
// before offline maps were keyed that way.
export const getOfflineMap = (offlineMaps, map) => offlineMaps[getTileFolderName(map.id, map.source)]
  || offlineMaps[map.id];

// A preview is named by the map's tile folder, not its id
export const isPreviewedMap = (map, previewedOfflineMapId) => !!previewedOfflineMapId
  && getTileFolderName(map.id, map.source) === previewedOfflineMapId;

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
