import proj4 from 'proj4';

import {DEFAULT_MAPS, GEO_LAT_LNG_PROJECTION, MAP_MODES, MAP_PROVIDERS, PIXEL_PROJECTION} from './maps.constants';
import {isEmpty} from '../../shared/helpers';

// proj4 definition for a UTM zone on the WGS84 datum
const getUtmProjection = (zoneNumber, isNorthernHemisphere) =>
  `+proj=utm +zone=${zoneNumber} ${isNorthernHemisphere ? '' : '+south '}+datum=WGS84 +units=m +no_defs`;

// UTM zones are 6 degrees of longitude wide, numbered 1-60 starting at -180. The Norway/Svalbard
// zone exceptions are not applied - StraboSpot stores WGS84, so this only affects how it is displayed.
const getUtmZoneNumber = lng => Math.floor((((lng + 180) % 360) + 360) % 360 / 6) + 1;

// Easting/northing are displayed to the centimeter - finer than any field GPS, but precise enough that
// converting a displayed value back to WGS84 does not visibly move the Spot
const roundUtmMeters = meters => Math.round(meters * 100) / 100;

// Convert coordinates of a feature from one projection to another
export const convertCoords = (feature, fromProjection, toProjection) => {
  if (feature.geometry.type === 'Point') {
    feature.geometry.coordinates = proj4(fromProjection, toProjection, feature.geometry.coordinates);
  }
  else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiPoint') {
    feature.geometry.coordinates = feature.geometry.coordinates.map(
      pointCoords => proj4(fromProjection, toProjection, pointCoords));
  }
  else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiLineString') {
    feature.geometry.coordinates = feature.geometry.coordinates.map(
      lineCoords => lineCoords.map(pointCoords => proj4(fromProjection, toProjection, pointCoords)));
  }
  else if (feature.geometry.type === 'MultiPolygon') {
    feature.geometry.coordinates = feature.geometry.coordinates.map(polygonCoords => polygonCoords.map(
      lineCoords => lineCoords.map(pointCoords => proj4(fromProjection, toProjection, pointCoords))));
  }
  // Interbedded (Geometry Collections)
  else if (feature.geometry.type === 'GeometryCollection') {
    feature.geometry.geometries = feature.geometry.geometries.map((geometry) => {
      return {
        type: geometry.type,
        coordinates: geometry.coordinates.map(
          lineCoords => lineCoords.map(pointCoords => proj4(fromProjection, toProjection, pointCoords))),
      };
    });
  }
  return feature;
};

// Convert WGS84 to image x,y pixels, assuming x,y are web mercator
export const convertFeatureGeometryToImagePixels = feature => convertCoords(feature, GEO_LAT_LNG_PROJECTION,
  PIXEL_PROJECTION);

// Convert image x,y pixels to WGS84, assuming x,y are web mercator
export const convertImagePixelsToLatLong = feature => convertCoords(feature, PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION);

// Convert [lng, lat] to UTM easting/northing in the zone that contains it
export const convertLatLngToUtm = ([lng, lat]) => {
  const zoneNumber = getUtmZoneNumber(lng);
  const isNorthernHemisphere = lat >= 0;
  const [easting, northing] = proj4(GEO_LAT_LNG_PROJECTION, getUtmProjection(zoneNumber, isNorthernHemisphere),
    [lng, lat]);
  return {
    easting: roundUtmMeters(easting),
    northing: roundUtmMeters(northing),
    zone: `${zoneNumber}${isNorthernHemisphere ? 'N' : 'S'}`,
  };
};

// Convert UTM easting/northing in the given zone (e.g. '13N') back to [lng, lat]; undefined if the zone is invalid
export const convertUtmToLatLng = (easting, northing, zone) => {
  const parsedZone = parseUtmZone(zone);
  if (!parsedZone) return undefined;
  return proj4(getUtmProjection(parsedZone.zoneNumber, parsedZone.isNorthernHemisphere),
    GEO_LAT_LNG_PROJECTION, [Number(easting), Number(northing)]);
};

// Get the closest spot distance and index from an array of distances
export const getClosestSpotDistanceAndIndex = (distancesFromSpot) => {
  let minDistance = Number.MAX_VALUE;
  let minIndex = -1;
  for (let j = 0; j < distancesFromSpot.length; j++) {
    if (minDistance > distancesFromSpot[j]) { // trying to get the minimum distance
      minDistance = distancesFromSpot[j];
      minIndex = j;
    } // else we can ignore that feature.
  }
  return [minDistance, minIndex];
};

// One-line UTM readout for [lng, lat], e.g. 'UTM 13N  476915 mE  4429457 mN'
export const getUtmDisplayString = ([lng, lat]) => {
  const {easting, northing, zone} = convertLatLngToUtm([lng, lat]);
  return `UTM ${zone}  ${Math.round(easting)} mE  ${Math.round(northing)} mN`;
};

// A basemap the app ships. Read the list rather than restating its ids, which drifts as maps are added.
// A map downloaded to the device is stored under a source of its own, so the provider it actually came from is
// recovered from the custom map source kept beside it, or from the default map it is a copy of.
export const getMapProviderSource = map => MAP_PROVIDERS[map?.source] ? map.source
  : map?.customMapSource || DEFAULT_MAPS.find(defaultMap => defaultMap.id === map?.id)?.source;

// The credit a list of maps owes, as one line naming each party once. Built from the parties a provider credits
// rather than from its `attributions` sentence, which is written for the map's own attribution control: several
// providers say the same sentence, one provider credits two parties within a sentence, and one states its whole
// service name, so joining those sentences repeats a name and runs long. A list needs a credit of its own at all
// because that control only speaks for the map being rendered, and says nothing about the tiles drawn beside the
// names here - which include tiles bundled with the app.
export const getAttributionText = (maps) => {
  const credits = [...new Set(maps.flatMap(map => MAP_PROVIDERS[getMapProviderSource(map)]?.credits || []))];
  return isEmpty(credits) ? '' : `Map data © ${credits.join(', ')}`;
};

export const isDefaultMap = map => DEFAULT_MAPS.some(defaultMap => defaultMap.id === map.id);

export const isDrawMode = mode => Object.values(MAP_MODES.DRAW).includes(mode);

export const isOnGeoMap = feature => isEmpty(feature) ? false
  : !feature.properties.image_basemap && !feature.properties.strat_section_id;

export const isOnImageBasemap = feature => feature.properties?.image_basemap;

export const isOnStratSection = feature => feature.properties?.strat_section_id;

// Parse a zone label like '13N' or '59s' into its number and hemisphere; undefined if not a valid zone
export const parseUtmZone = (zone) => {
  const match = /^\s*(\d{1,2})\s*([NnSs])\s*$/.exec(String(zone));
  if (!match) return undefined;
  const zoneNumber = parseInt(match[1], 10);
  if (zoneNumber < 1 || zoneNumber > 60) return undefined;
  return {isNorthernHemisphere: match[2].toUpperCase() === 'N', zoneNumber: zoneNumber};
};
