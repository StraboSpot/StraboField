import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';

import useMapSymbology from '../symbology/useMapSymbology';

const FeaturesNotSelectedLayers = ({features}) => {
  /* Data Hooks */

  const {getLayoutSymbology, getLinesFilteredByPattern, getPaintSymbology} = useMapSymbology();

  /* View */

  return (
    <Source
      data={turf.featureCollection(features)}
      id={'spotsNotSelectedSource'}
      type={'geojson'}
    >
      {/* Polygon Not Selected */}
      <Layer
        filter={['all', ['==', ['geometry-type'], 'Polygon'], ['!', ['has', 'fillPattern', ['get', 'symbology']]]]}
        id={'polygonLayerNotSelected'}
        paint={getPaintSymbology().polygon}
        type={'fill'}
      />
      <Layer
        filter={['all', ['==', ['geometry-type'], 'Polygon'], ['has', 'fillPattern', ['get', 'symbology']]]}
        id={'polygonLayerWithPatternNotSelected'}
        paint={getPaintSymbology().polygonWithPattern}
        type={'fill'}
      />
      <Layer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLayerNotSelectedBorder'}
        paint={getPaintSymbology().line}
        type={'line'}
      />
      <Layer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLabelLayerNotSelected'}
        layout={getLayoutSymbology().polygonLabel}
        type={'symbol'}
      />

      {/* Line Not Selected */}
      {/* Need 4 different lines for the different types of line dashes since
       lineDasharray is not supported with data-driven styling*/}
      <Layer
        filter={getLinesFilteredByPattern('solid')}
        id={'lineLayerNotSelected'}
        paint={getPaintSymbology().line}
        type={'line'}
      />
      <Layer
        filter={getLinesFilteredByPattern('dotted')}
        id={'lineLayerNotSelectedDotted'}
        paint={getPaintSymbology().lineDotted}
        type={'line'}
      />
      <Layer
        filter={getLinesFilteredByPattern('dashed')}
        id={'lineLayerNotSelectedDashed'}
        paint={getPaintSymbology().lineDashed}
        type={'line'}
      />
      <Layer
        filter={getLinesFilteredByPattern('dotDashed')}
        id={'lineLayerNotSelectedDotDashed'}
        paint={getPaintSymbology().lineDotDashed}
        type={'line'}
      />
      <Layer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'lineLabelLayerNotSelected'}
        layout={getLayoutSymbology().lineLabel}
        type={'symbol'}
      />

      {/* Point Not Selected */}
      <Layer
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerNotSelected'}
        layout={getLayoutSymbology().point}
        paint={getPaintSymbology().point}
        type={'symbol'}
      />
    </Source>
  );
};

export default FeaturesNotSelectedLayers;
