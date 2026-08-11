import {useSelector} from 'react-redux';

import {GLYPHS_URL} from './glyphs/glyphs.constants';
import {MAPBOX_TOKEN} from './maps.constants';
import {isEmpty} from '../../shared/helpers';

const useMapURL = () => {
  /* Data Hooks */

  const userMapboxToken = useSelector(state => state.user.mapboxToken);

  /* Derived Variables */

  // A personal token is only needed for styles in the user's own Mapbox account, so fall back to the app token
  // rather than sending 'access_token=null'. Matches the fallback useMapsOffline applies to tile downloads.
  const mapboxToken = isEmpty(userMapboxToken) ? MAPBOX_TOKEN : userMapboxToken;

  /* Exported Functions */

  const buildStyleURL = (map) => {
    let tileURL;
    let mapID = map.id.trim();
    if (map.source === 'map_warper' || map.source === 'strabospot_mymaps') tileURL = map.url[0] + mapID + '/' + map.tilePath;
    else {
      tileURL = map.url[0] + (map.source === 'mapbox_styles' && map.url[0].includes('file://') ? mapID.split(
        '/')[1] : mapID) + map.tilePath + (map.url[0].includes(
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
    else if (basemap.source === 'strabospot_mymaps') tileUrl = tileUrl + basemap.id + '/' + basemap.tilePath;
    else tileUrl = tileUrl + basemap.id + basemap.tilePath + '?access_token=' + mapboxToken;
    return tileUrl;
  };

  return {
    buildStyleURL,
    buildTileURL,
  };
};

export default useMapURL;
