import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

import useMapSymbology from '../symbology/useMapSymbology';

const SampleLayers = ({features}) => {
  const isShowSamplesOn = useSelector(state => state.map.isShowSamplesOn);

  const {getMapSymbology} = useMapSymbology();

  const featuresWithSamples = features.reduce((acc, feature) => {
    return feature.properties?.samples && feature.properties.samples.length >= 1 ? [...acc, feature] : acc;
  }, []);

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
            id={'pointLayerSampleSymbols'}
            minZoomLevel={1}
            filter={['==', ['geometry-type'], 'Point']}
            style={getMapSymbology().sample}
          />
        </MapboxGL.ShapeSource>
      </>
    );
  }
};

export default SampleLayers;
