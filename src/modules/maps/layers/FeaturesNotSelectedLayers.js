import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

import useMapSymbology from '../symbology/useMapSymbology';

const FeaturesNotSelectedLayers = ({features}) => {
  /* Data Hooks */

  const {stratSection} = useSelector(state => state.map);

  const {getLinesFilteredByPattern, getMapSymbology} = useMapSymbology();

  /* View */

  return (
    <MapboxGL.ShapeSource
      id={'spotsNotSelectedSource'}
      shape={turf.featureCollection(features)}
    >
      {/* Polygon Not Selected */}
      <MapboxGL.FillLayer
        filter={['all', ['==', ['geometry-type'], 'Polygon'], ['!', ['has', 'fillPattern', ['get', 'symbology']]]]}
        id={'polygonLayerNotSelected'}
        minZoomLevel={1}
        style={getMapSymbology().polygon}
      />
      <MapboxGL.FillLayer
        filter={['all', ['==', ['geometry-type'], 'Polygon'], ['has', 'fillPattern', ['get', 'symbology']]]}
        id={'polygonLayerWithPatternNotSelected'}
        minZoomLevel={1}
        style={{...getMapSymbology().polygonWithPattern, visibility: stratSection ? 'visible' : 'none'}}
      />
      <MapboxGL.LineLayer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLayerNotSelectedBorder'}
        minZoomLevel={1}
        style={getMapSymbology().line}
      />
      <MapboxGL.SymbolLayer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLabelLayerNotSelected'}
        minZoomLevel={1}
        style={getMapSymbology().polygonLabel}
      />

      {/* Line Not Selected */}
      {/* Need 4 different lines for the different types of line dashes since
       lineDasharray is not supported with data-driven styling*/}
      <MapboxGL.LineLayer
        filter={getLinesFilteredByPattern('solid')}
        id={'lineLayerNotSelected'}
        minZoomLevel={1}
        style={getMapSymbology().line}
      />
      <MapboxGL.LineLayer
        filter={getLinesFilteredByPattern('dotted')}
        id={'lineLayerNotSelectedDotted'}
        minZoomLevel={1}
        style={getMapSymbology().lineDotted}
      />
      <MapboxGL.LineLayer
        filter={getLinesFilteredByPattern('dashed')}
        id={'lineLayerNotSelectedDashed'}
        minZoomLevel={1}
        style={getMapSymbology().lineDashed}
      />
      <MapboxGL.LineLayer
        filter={getLinesFilteredByPattern('dotDashed')}
        id={'lineLayerNotSelectedDotDashed'}
        minZoomLevel={1}
        style={getMapSymbology().lineDotDashed}
      />
      <MapboxGL.SymbolLayer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'lineLabelLayerNotSelected'}
        minZoomLevel={1}
        style={getMapSymbology().lineLabel}
      />

      {/* Point Not Selected */}
      <MapboxGL.SymbolLayer
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerNotSelected'}
        minZoomLevel={1}
        style={getMapSymbology().point}
      />
    </MapboxGL.ShapeSource>
  );
};

export default FeaturesNotSelectedLayers;
