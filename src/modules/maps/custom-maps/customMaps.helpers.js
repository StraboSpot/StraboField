import {MAP_TYPE_NAMES} from './customMaps.constants';
import {isEmpty} from '../../../shared/helpers';

export const getMapTypeName = source => MAP_TYPE_NAMES[source];

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
