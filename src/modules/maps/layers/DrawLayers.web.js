import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl';

import useMapSymbology from '../symbology/useMapSymbology';

const DrawLayers = ({drawFeatures}) => {

  const {getPaintSymbology} = useMapSymbology();

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
