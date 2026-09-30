import {CUSTOM_MAP_SOURCES, MAP_TYPE_NAMES} from './customMaps.constants';
import {isEmpty} from '../../../shared/helpers';
import {getTileFolderName} from '../offline-maps/offlineMaps.helpers';

// Whether a map's tiles can be loaded: a custom server's over the network it is on, every other map's only over
// the internet. Which database is selected does not matter here, since a Mapbox style is on the internet either way.
export const canReachMapTiles = (map, {isConnected, isInternetReachable}) => isCustomServerMap(map)
  ? isConnected : isInternetReachable;

// The project's copy of a map, by id or - for a map listed from the device's downloaded tiles - by the tile folder
// those tiles were saved under, which for a Mapbox style is the style id without its account prefix.
export const findCustomMap = (customMaps, map) => customMaps[map.id]
  || Object.values(customMaps).find(customMap => getTileFolderName(customMap.id, customMap.source) === map.id);

// The maps for the database in use: with a custom server selected only the maps it serves, and otherwise every map
// but those. A custom server's maps cannot be reached from strabospot.org, nor strabospot.org's from it.
export const getCustomMapsForDatabase = (customMaps, isCustomServerSelected) => Object.values(customMaps)
  .filter(map => isCustomServerMap(map) === isCustomServerSelected);

export const getLiveCustomMaps = customMaps => Object.values(customMaps)
  .filter(map => isLiveCustomMapSource(map.source));

export const getMapTypeName = source => MAP_TYPE_NAMES[source];

// An opacity never set, or saved outside the slider's range, draws the map fully opaque.
export const getOverlayOpacity = (map) => {
  const opacity = parseFloat(map?.opacity);
  return opacity > 0 && opacity <= 1 ? opacity : 1;
};

// Every map switched on as an overlay: the loaded project's custom maps, plus maps downloaded to this device under
// another project. A downloaded copy of a map the project already has is dropped - it is the same tiles under the
// name of its tile folder, and two raster sources cannot share an id.
export const getVisibleCustomOverlays = (customMaps, offlineMaps) => {
  const projectMaps = Object.values(customMaps).filter(map => map?.id);
  const projectTileFolders = projectMaps.map(map => getTileFolderName(map.id, map.source));
  return [
    ...projectMaps.filter(map => map.overlay && map.isViewable),
    ...Object.values(offlineMaps).filter(
      map => map?.id && map.overlay && map.isViewable && !projectTileFolders.includes(map.id)),
  ];
};

// Only My Maps come from a custom server, and it can be at any address, so its maps are the My Maps that are not
// on strabospot.org
export const isCustomServerMap = map => map.source === CUSTOM_MAP_SOURCES.STRABO_MY_MAPS && !!map.url?.[0]
  && !map.url[0].includes('strabospot.org');

// Whether a downloaded map is switched on as an overlay. For one of the project's own maps the switch is kept on
// the project's map, so the download's own `overlay` flag is only read for a map from another project.
export const isOfflineMapOverlayOn = (customMaps, offlineMaps, offlineMap) => getVisibleCustomOverlays(
  customMaps, offlineMaps).some(map => getTileFolderName(map.id, map.source) === offlineMap.id);

// A map from a provider still offered. Maps saved under the retired ones are still in projects, so their source
// is recognized elsewhere, but they are not listed among the basemaps and cannot be opened from the custom maps list.
export const isLiveCustomMapSource = source => source === CUSTOM_MAP_SOURCES.MAPBOX_STYLES
  || source === CUSTOM_MAP_SOURCES.STRABO_MY_MAPS;

// A style pasted as a full mapbox://styles/user/style URL is stored, and compared, as user/style.
export const normalizeCustomMapId = (id, source) =>
  source === CUSTOM_MAP_SOURCES.MAPBOX_STYLES && id.includes('mapbox://styles/')
    ? id.trim().split('/').slice(3).join('/') : id.trim();

// Custom maps used to carry the creating user's personal Mapbox token (`key`, or `accessToken` in older backups).
// Nothing reads it — tile URLs are always built from the current user's profile token — so strip it instead of
// persisting, exporting and re-uploading one user's credential with the project.
export const stripMapboxToken = ({accessToken, key, ...map}) => map;

// state.map.customMaps, keyed by map id.
export const stripMapboxTokenFromCustomMaps = customMaps => Object.fromEntries(
  Object.entries(customMaps).map(([id, map]) => [id, stripMapboxToken(map)]));

// state.project.project, whose other_maps is an array.
export const stripMapboxTokenFromProject = project => isEmpty(project?.other_maps) ? project
  : {...project, other_maps: project.other_maps.map(stripMapboxToken)};

// Whether a map is drawn over the basemap, and how solidly, is switched from the map layers menu while the map is
// on screen, so the edit form neither shows these keys nor writes back the ones it was opened with.
export const stripOverlayDisplaySettings = ({opacity, overlay, ...map}) => map;
