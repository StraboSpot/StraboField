import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';

import useMapSymbology from '../symbology/useMapSymbology';

const FeaturesSelectedLayers = ({featuresSelected}) => {

  const {getLayoutSymbology, getLinesFilteredByPattern, getPaintSymbology} = useMapSymbology();

  return (
    <Source
      data={turf.featureCollection(featuresSelected)}
      id={'spotsSelectedSource'}
      type={'geojson'}
    >
      {/* Polygon Selected */}
      <Layer
        filter={['all', ['==', ['geometry-type'], 'Polygon'], ['!', ['has', 'fillPattern', ['get', 'symbology']]]]}
        id={'polygonLayerSelected'}
        paint={getPaintSymbology().polygonSelected}
        type={'fill'}
      />
      <Layer
        filter={['all', ['==', ['geometry-type'], 'Polygon'], ['has', 'fillPattern', ['get', 'symbology']]]}
        id={'polygonLayerWithPatternSelected'}
        paint={getPaintSymbology().polygonWithPatternSelected}
        type={'fill'}
      />
      <Layer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLayerSelectedBorder'}
        paint={getPaintSymbology().line}
        type={'line'}
      />
      <Layer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLabelLayerSelected'}
        layout={getLayoutSymbology().polygonLabel}
        type={'symbol'}
      />

      {/* Line Selected */}
      {/* Need 4 different lines for the different types of line dashes since
       lineDasharray is not supported with data-driven styling*/}
      <Layer
        filter={getLinesFilteredByPattern('solid')}
        id={'lineLayerSelected'}
        paint={getPaintSymbology().lineSelected}
        type={'line'}
      />
      <Layer
        filter={getLinesFilteredByPattern('dotted')}
        id={'lineLayerSelectedDotted'}
        paint={getPaintSymbology().lineSelectedDotted}
        type={'line'}
      />
      <Layer
        filter={getLinesFilteredByPattern('dashed')}
        id={'lineLayerSelectedDashed'}
        paint={getPaintSymbology().lineSelectedDashed}
        type={'line'}
      />
      <Layer
        filter={getLinesFilteredByPattern('dotDashed')}
        id={'lineLayerSelectedDotDashed'}
        paint={getPaintSymbology().lineSelectedDotDashed}
        type={'line'}
      />
      <Layer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'lineLabelLayerSelected'}
        layout={getLayoutSymbology().lineLabel}
        type={'symbol'}
      />
    </Source>
  );
};

export default FeaturesSelectedLayers;
