import {useSelector} from 'react-redux';

import {CUSTOM_MAP_SOURCES} from './custom-maps/customMaps.constants';
import {GLYPHS_URL} from './glyphs/glyphs.constants';
import {MAP_PROVIDERS, MAPBOX_TOKEN, THUMBNAIL_TILE} from './maps.constants';
import {getTileFolderName, lat2tile, lat2tileFraction, long2tile, long2tileFraction}
  from './offline-maps/offlineMaps.helpers';
import {isEmpty} from '../../shared/helpers';

// How deep a thumbnail may go for a provider that names no ceiling of its own. A provider that does states
// how far its tiles are built, and is followed instead - a small map needs a deep tile to fill a thumbnail.
const THUMBNAIL_MAX_ZOOM = 16;

const useMapURL = () => {
  /* Data Hooks */

  const {isInternetReachable} = useSelector(state => state.connections.isOnline);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const userMapboxToken = useSelector(state => state.user.mapboxToken);

  /* Derived Variables */

  // A personal token is only needed for styles in the user's own Mapbox account, so fall back to the app token
  // rather than sending 'access_token=null'. Matches the fallback useMapsOffline applies to tile downloads.
  const mapboxToken = isEmpty(userMapboxToken) ? MAPBOX_TOKEN : userMapboxToken;

  /* Internal Functions */

  // The deepest zoom whose tiles are no bigger than the map itself, so the tile drawn is one the map covers.
  // Sized from the extent rather than searched for in the tile grid: an extent smaller than a tile still belongs
  // to no single tile when it lies across a grid line, and looking for one that holds it whole gives up several
  // zooms to find it - leaving the map a speck in a tile that is mostly empty, which is then all the thumbnail
  // shows. Where even the deepest tile allowed is bigger than the map, that is as close as its provider goes.
  const getExtentFitZoom = (west, south, east, north, maxZoom) => {
    const extentInTiles = Math.min(
      long2tileFraction(east, 0) - long2tileFraction(west, 0),
      lat2tileFraction(south, 0) - lat2tileFraction(north, 0),
    );
    if (!(extentInTiles > 0)) return maxZoom;
    // Two tiles across rather than one: at one, a map only just wider than a tile still leaves the tile holding
    // its middle hanging over an edge. At two, the middle is a full tile clear of every edge whatever it lands on.
    return Math.max(0, Math.min(maxZoom, Math.ceil(Math.log2(2 / extentInTiles))));
  };

  // A Mapbox style draws the whole world, so it has no extent of its own to show and none is asked of it. It is
  // drawn at the reference tile instead, the same one the default basemaps ship a bundled tile of, which is what
  // makes a style comparable with them. Its own `center` and `zoom` are not used: those are wherever the author
  // last left the camera in Studio, which is a continent away at a continental zoom about as often as not.
  const isWorldStyle = map => map.source === CUSTOM_MAP_SOURCES.MAPBOX_STYLES
    || map.source === CUSTOM_MAP_SOURCES.MAPBOX_STYLES_LEGACY;

  // A tile at the middle of a map, taken at a zoom the map covers. Only the middle of that tile is shown — the
  // thumbnail crops rather than shrinks — so this lands well inside the map. A georeferenced map with no stored
  // extent is an image sitting in an empty world, and there is nowhere to point a thumbnail at.
  const getThumbnailTile = (map) => {
    const [west, south, east, north] = isEmpty(map.bbox) ? [] : map.bbox.split(',').map(Number);
    if (![west, south, east, north].every(Number.isFinite)) return isWorldStyle(map) ? THUMBNAIL_TILE : undefined;
    const maxZoom = map.maxZoom ?? MAP_PROVIDERS[map.source]?.maxZoom ?? THUMBNAIL_MAX_ZOOM;
    const zoom = getExtentFitZoom(west, south, east, north, maxZoom);
    return [zoom, long2tile((west + east) / 2, zoom), lat2tile((south + north) / 2, zoom)];
  };

  // A default basemap keys its source by the map id, a map downloaded to this device by 'raster-tiles', and a
  // custom map has no style object at all until it is shown, so its tiles are built from its provider.
  const getTileTemplate = map => map.sources?.[map.id]?.tiles?.[0]
    || map.sources?.['raster-tiles']?.tiles?.[0]
    || (map.url && buildTileURL(map));

  /* Exported Functions */

  // An overlay draws from the copy downloaded to this device when there is no connection to serve the live tiles,
  // matching how a custom map is picked as a basemap. A map listed from the device carries its own file:// template.
  const buildOverlayTileURL = (map) => {
    const offlineMap = map.sources?.['raster-tiles'] ? map
      : offlineMaps[getTileFolderName(map.id, map.source)] || offlineMaps[map.id];
    if (offlineMap && (offlineMap === map || !isInternetReachable)) return offlineMap.sources['raster-tiles'].tiles[0];
    return buildTileURL(map);
  };

  const buildStyleURL = (map) => {
    let tileURL;
    let mapID = map.id.trim();
    if (map.source === CUSTOM_MAP_SOURCES.MAP_WARPER || map.source === CUSTOM_MAP_SOURCES.STRABO_MY_MAPS) {
      tileURL = map.url[0] + mapID + '/' + map.tilePath;
    }
    else {
      // Offline tiles are cached under the styleId only (see getTileFolderName). Offline maps carry
      // source 'direct from filesystem' rather than 'mapbox_styles', so key off a local file:// url plus a
      // '/' in the id to strip the 'username/' prefix. Online (https) Mapbox styles keep the full id.
      const tileId = map.url[0].includes('file://') && mapID.includes('/') ? mapID.split('/').pop() : mapID;
      tileURL = map.url[0] + tileId + map.tilePath + (map.url[0].includes(
        'https://') ? '?access_token=' + mapboxToken : '');
    }
    const styleURL = {
      source: map.source,
      id: mapID,
      bbox: map?.bbox,
      version: 8,
      sources: {
        [mapID]: {
          type: 'raster',
          tiles: [tileURL],
          tileSize: 256,
        },
      },
      glyphs: GLYPHS_URL,
      layers: [
        {
          'id': 'background',
          'type': 'background',
          'paint': {
            'background-color': 'white',
          },
        },
        {
          id: mapID,
          type: 'raster',
          source: mapID,
          minzoom: 0,
        },
      ],
    };
    return styleURL;
  };

  const buildTileURL = (basemap) => {
    let tileUrl = basemap.url[0];
    if (basemap.source === 'osm') tileUrl = tileUrl + basemap.tilePath;
    else if (basemap.source === CUSTOM_MAP_SOURCES.STRABO_MY_MAPS) tileUrl = tileUrl + basemap.id + '/' + basemap.tilePath;
    else tileUrl = tileUrl + basemap.id + basemap.tilePath + '?access_token=' + mapboxToken;
    return tileUrl;
  };

  // One tile standing in for the whole map in a list: a close-up of the map's own area, or of the reference place
  // for a style that has no area of its own. The default basemaps ship a bundled tile instead, and a map that is
  // neither — a georeferenced one whose extent is not known — is drawn as its map type by the caller.
  const buildThumbnailTileURL = (map) => {
    const tileTemplate = getTileTemplate(map);
    if (!tileTemplate) return;
    const tile = getThumbnailTile(map);
    if (!tile) return;
    const [zoom, x, y] = tile;
    return tileTemplate.replace('{z}', zoom).replace('{x}', x).replace('{y}', y);
  };

  return {
    buildOverlayTileURL,
    buildStyleURL,
    buildThumbnailTileURL,
    buildTileURL,
  };
};

export default useMapURL;
