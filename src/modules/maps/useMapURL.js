import {useSelector} from 'react-redux';

import {GLYPHS_URL} from './glyphs/glyphs.constants';

const useMapURL = () => {
  /* Data Hooks */

  const userMapboxToken = useSelector(state => state.user.mapboxToken);

  /* Exported Functions */

  const buildStyleURL = (map) => {
    let tileURL;
    let mapID = map.id.trim();
    if (map.source === 'map_warper' || map.source === 'strabospot_mymaps') tileURL = map.url[0] + mapID + '/' + map.tilePath;
    else {
      tileURL = map.url[0] + (map.source === 'mapbox_styles' && map.url[0].includes('file://') ? mapID.split(
        '/')[1] : mapID) + map.tilePath + (map.url[0].includes(
        'https://') ? '?access_token=' + userMapboxToken : '');
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
    if (basemap.source === 'strabospot_mymaps') tileUrl = tileUrl + basemap.id + '/' + basemap.tilePath;
    else tileUrl = tileUrl + basemap.id + basemap.tilePath + '?access_token=' + userMapboxToken;
    return tileUrl;
  };

  return {
    buildStyleURL,
    buildTileURL,
  };
};

export default useMapURL;
