import {CUSTOM_MAP_SOURCES, MAP_TYPE_NAMES} from './customMaps.constants';
import {isEmpty} from '../../../shared/helpers';

export const getLiveCustomMaps = customMaps => Object.values(customMaps)
  .filter(map => isLiveCustomMapSource(map.source) && !map.overlay);

export const getLiveCustomOverlays = customMaps => Object.values(customMaps)
  .filter(map => isLiveCustomMapSource(map.source) && map.overlay);

export const getMapTypeName = source => MAP_TYPE_NAMES[source];

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
