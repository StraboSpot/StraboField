import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

import useMapSymbology from '../symbology/useMapSymbology';

const FeaturesSelectedLayers = ({featuresSelected, isStratStyleLoaded}) => {
  const {stratSection} = useSelector(state => state.map);

  const {getLinesFilteredByPattern, getMapSymbology} = useMapSymbology();

  return (
    <MapboxGL.ShapeSource
      id={'spotsSelectedSource'}
      shape={turf.featureCollection(featuresSelected)}
    >
      {/* Polygon Selected */}
      <MapboxGL.FillLayer
        filter={['all', ['==', ['geometry-type'], 'Polygon'], ['!', ['has', 'fillPattern', ['get', 'symbology']]]]}
        id={'polygonLayerSelected'}
        minZoomLevel={1}
        style={getMapSymbology().polygonSelected}
      />
      <MapboxGL.FillLayer
        filter={['all', ['==', ['geometry-type'], 'Polygon'], ['has', 'fillPattern', ['get', 'symbology']]]}
        id={'polygonLayerWithPatternSelected'}
        minZoomLevel={1}
        style={{
          ...getMapSymbology().polygonWithPatternSelected,
          visibility: stratSection && isStratStyleLoaded ? 'visible' : 'none',
        }}
      />
      <MapboxGL.LineLayer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLayerSelectedBorder'}
        minZoomLevel={1}
        style={getMapSymbology().line}
      />
      <MapboxGL.SymbolLayer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLabelLayerSelected'}
        minZoomLevel={1}
        style={getMapSymbology().polygonLabel}
      />

      {/* Line Selected */}
      {/* Need 4 different lines for the different types of line dashes since
       lineDasharray is not supported with data-driven styling*/}
      <MapboxGL.LineLayer
        filter={getLinesFilteredByPattern('solid')}
        id={'lineLayerSelected'}
        minZoomLevel={1}
        style={getMapSymbology().lineSelected}
      />
      <MapboxGL.LineLayer
        filter={getLinesFilteredByPattern('dotted')}
        id={'lineLayerSelectedDotted'}
        minZoomLevel={1}
        style={getMapSymbology().lineSelectedDotted}
      />
      <MapboxGL.LineLayer
        filter={getLinesFilteredByPattern('dashed')}
        id={'lineLayerSelectedDashed'}
        minZoomLevel={1}
        style={getMapSymbology().lineSelectedDashed}
      />
      <MapboxGL.LineLayer
        filter={getLinesFilteredByPattern('dotDashed')}
        id={'lineLayerSelectedDotDashed'}
        minZoomLevel={1}
        style={getMapSymbology().lineSelectedDotDashed}
      />
      <MapboxGL.SymbolLayer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'lineLabelLayerSelected'}
        minZoomLevel={1}
        style={getMapSymbology().lineLabel}
      />

    </MapboxGL.ShapeSource>
  );
};

export default FeaturesSelectedLayers;
