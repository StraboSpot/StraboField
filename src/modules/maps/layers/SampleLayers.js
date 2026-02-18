import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

import {getFeaturesWithSamples} from './layers.helpers';
import useMapSymbology from '../symbology/useMapSymbology';

const SampleLayers = ({features}) => {
  const isShowSamplesOn = useSelector(state => state.map.isShowSamplesOn);

  const {getMapSymbology} = useMapSymbology();

  const featuresWithSamples = getFeaturesWithSamples(features);

  if (isShowSamplesOn) {
    return (
      <>
        {/* Starburst at Point Features with a Sample Layer */}
        <MapboxGL.ShapeSource
          id={'pointFeaturesSamplesSource'}
          shape={turf.featureCollection(featuresWithSamples)}
        >
          <MapboxGL.SymbolLayer
            aboveLayerID={'pointLayerColorHalo'}
            filter={['==', ['geometry-type'], 'Point']}
            id={'pointLayerSampleSymbols'}
            minZoomLevel={1}
            style={getMapSymbology().sample}
          />
        </MapboxGL.ShapeSource>
      </>
    );
  }
};

export default SampleLayers;
