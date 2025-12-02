import {STRABO_APIS} from '../../services/urls.constants';
import config from '../../utils/config';

export const LATITUDE = 39.828175;      // Geographic center of US;
export const LONGITUDE = -98.5795;      // Geographic center of US;
export const GEO_LAT_LNG_PROJECTION = 'EPSG:4326';
export const PIXEL_PROJECTION = 'EPSG:3857';
export const STRAT_SECTION_CENTER = [0.001, 0.0007];
export const ZOOM = 14;                 // Default zoom for geographic map and image basemaps
export const ZOOM_STRAT_SECTION = 18;   // Default zoom for strat sections

export const MAPBOX_TOKEN = config.get('mapbox_access_token');

export const MAP_MODES = {
  VIEW: 'view',
  DRAW: {
    POINT: 'point',
    LINE: 'line',
    POLYGON: 'polygon',
    FREEHANDPOLYGON: 'freehandpolygon',
    FREEHANDLINE: 'freehandline',
    POINTLOCATION: 'pointLocation',
    MEASURE: 'measure',
  },
  EDIT: 'edit',
};

export const DEFAULT_MAPS = [
  {
    title: 'Mapbox Topo',
    id: 'mapbox.outdoors',
    source: 'strabospot_mapbox',
  }, {
    title: 'Mapbox Satellite',
    id: 'mapbox.satellite',
    source: 'strabospot_mapbox',
  }, {
    title: 'OSM Streets',
    id: 'osm',
    source: 'osm',
  }, {
    title: 'Geology from Macrostrat',
    id: 'macrostrat',
    source: 'macrostrat',
  }, {
    title: 'USGS Hillshade',
    id: 'usgs.hillshade',
    source: 'strabospot_usgs_hillshade',
  }];

export const CUSTOM_MAP_TYPES = [
  {
    title: 'Mapbox Styles',
    id: 'mapbox.styles',
    source: 'mapbox_styles',
  },
  {
    title: 'Strabospot My Maps',
    id: 'strabospot.mymaps',
    source: 'strabospot_mymaps',
  },
];

export const MAP_PROVIDERS = {
  mapbox_classic: {
    attributions: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
    imageType: 'png',
    mime: 'image/png',
    tilePath: '/{z}/{x}/{y}.png',
    url: ['https://api.mapbox.com/v4/'],
  },
  mapbox_styles: {
    attributions: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
    mime: 'image/png',
    tilePath: '/tiles/256/{z}/{x}/{y}',
    url: ['https://api.mapbox.com/styles/v1/'],
    // maxZoom: 20,
  },
  osm: {
    attributions: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
    imageType: 'png',
    mime: 'image/png',
    tilePath: '{z}/{x}/{y}.png',
    url: [
      'https://a.tile.openstreetmap.org/',
      'https://b.tile.openstreetmap.org/',
      'https://c.tile.openstreetmap.org/',
    ],
    maxZoom: 16,                  // http://wiki.openstreetmap.org/wiki/Zoom_levels
  },
  macrostrat: {
    attributions: '© <a href="https://macrostrat.org/#about">Macrostrat</a>',
    imageType: 'png',
    mime: 'image/png',
    tilePath: '/{z}/{x}/{y}.png',
    url: ['https://tiles.strabospot.org/v5/'],
  },
  strabospot_mapbox: {
    attributions: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
    imageType: 'png',
    mime: 'image/png',
    tilePath: '/{z}/{x}/{y}.png',
    url: ['https://tiles.strabospot.org/v5/'],
    maxZoom: 19,                   // https://www.mapbox.com/help/define-mapbox-satellite/
  },
  strabospot_mymaps: {
    attributions: '<a href="https://www.strabospot.org">StraboSpot Contributed</a>',
    imageType: 'png',
    mime: 'image/png',
    tilePath: '{z}/{x}/{y}.png',
    url: [STRABO_APIS.MY_MAPS_TILES],
    maxZoom: 25,
  },
  strabospot_usgs_hillshade: {
    attributions: '© <a href="https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer">The USGS 3D Elevation Program (3DEP) Bare Earth DEM Dynamic Service</a>',
    imageType: 'png',
    mime: 'image/png',
    tilePath: '/{z}/{x}/{y}.png',
    url: ['https://tiles.strabospot.org/v5/'],
  },
};

export const BASEMAPS = DEFAULT_MAPS.map((map) => {
  const tileUrl = map.source === 'osm' ? MAP_PROVIDERS[map.source].url[0] + MAP_PROVIDERS[map.source].tilePath
    : MAP_PROVIDERS[map.source].url[0] + map.id + MAP_PROVIDERS[map.source].tilePath;
  map.version = 8;
  map.sources = {
    [map.id]: {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      attribution: MAP_PROVIDERS[map.source].attributions,
    },
  };
  map.glyphs = 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf';
  map.layers = [{
    id: map.id,
    type: 'raster',
    source: map.id,
    minzoom: 0,
  }];
  return map;
});
// console.log('BASEMAPS', BASEMAPS);

export const CUSTOMBASEMAPS = CUSTOM_MAP_TYPES.map((map) => {
  return {...map, ...MAP_PROVIDERS[map.source]};
});
// console.log('CUSTOMBASEMAPS', BASEMAPS);

export const BACKGROUND = {
  title: 'Background',
  id: 'background',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  sources: {},
  layers: [{
    id: 'background',
    type: 'background',
    paint: {'background-color': '#ffffff'},
    layerIndex: 0,
  }],
  version: 8,
};
