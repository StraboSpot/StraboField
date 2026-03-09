import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';
import {useSelector} from 'react-redux';

import {getFeaturesWithSamples} from './layers.helpers';
import useMapSymbology from '../symbology/useMapSymbology';

const SampleLayers = ({features}) => {
  const isShowSamplesOn = useSelector(state => state.map.isShowSamplesOn);

  const {getLayoutSymbology, getPaintSymbology} = useMapSymbology();

  const featuresWithSamples = getFeaturesWithSamples(features);

  if (isShowSamplesOn) {
    return (
      <>
        {/* Starburst at Point Features with a Sample Layer */}
        <Source
          data={turf.featureCollection(featuresWithSamples)}
          id={'pointFeaturesSamplesSource'}
          type={'geojson'}
        >
          <Layer
            beforeId={'polygonLayerNotSelected'}
            filter={['==', ['geometry-type'], 'Point']}
            id={'pointLayerSampleSymbols'}
            layout={getLayoutSymbology().sample}
            minZoomLevel={1}
            paint={getPaintSymbology().sample}
            type={'symbol'}
          />
        </Source>
      </>
    );
  }
};

export default SampleLayers;
