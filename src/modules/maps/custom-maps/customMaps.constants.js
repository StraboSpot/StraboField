// The `source` a custom map is stored under. Basemaps and offline maps have their own values in maps.constants
// and useMapsOffline, so these name the custom map providers only.
export const CUSTOM_MAP_SOURCES = {
  MAPBOX_STYLES: 'mapbox_styles',
  STRABO_MY_MAPS: 'strabospot_mymaps',
  // Retired, but projects still hold maps saved under them. The two Mapbox spellings are two stored values
  // rather than one written two ways, so both have to be matched.
  MAP_WARPER: 'map_warper',
  MAPBOX_STYLES_LEGACY: 'Mapbox Style',
};

export const CUSTOM_MAP_TYPES = [
  {
    title: 'Mapbox Styles',
    id: 'mapbox.styles',
    source: CUSTOM_MAP_SOURCES.MAPBOX_STYLES,
  },
  {
    title: 'StraboSpot My Maps',
    id: 'strabospot.mymaps',
    source: CUSTOM_MAP_SOURCES.STRABO_MY_MAPS,
  },
];

export const MAP_TYPE_NAMES = {
  [CUSTOM_MAP_SOURCES.MAPBOX_STYLES]: 'Mapbox Styles',
  [CUSTOM_MAP_SOURCES.STRABO_MY_MAPS]: 'Strabo MyMaps',
};
