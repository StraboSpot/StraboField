import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';

import useMapSymbology from '../symbology/useMapSymbology';

const DrawLayers = ({drawFeatures}) => {
  /* Data Hooks */

  const {getPaintSymbology} = useMapSymbology();

  /* View */

  return (
    <Source
      data={turf.featureCollection(drawFeatures)}
      id={'drawFeatures'}
      type={'geojson'}
    >
      <Layer
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerDraw'}
        paint={getPaintSymbology().pointDraw}
        type={'circle'}
      />
      <Layer
        beforeId={'pointLayerDraw'}
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerDrawHalo'}
        paint={getPaintSymbology().pointDrawHalo}
        type={'circle'}
      />
      <Layer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'lineLayerDraw'}
        paint={getPaintSymbology().lineDraw}
        type={'line'}
      />
      <Layer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLayerDraw'}
        paint={getPaintSymbology().polygonDraw}
        type={'fill'}
      />
    </Source>
  );
};

export default DrawLayers;
