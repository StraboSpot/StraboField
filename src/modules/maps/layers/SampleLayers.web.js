import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl';
import {useSelector} from 'react-redux';

import useMapSymbology from '../symbology/useMapSymbology';

const SampleLayers = ({features}) => {
  const isShowSamplesOn = useSelector(state => state.map.isShowSamplesOn);

  const {getLayoutSymbology, getPaintSymbology} = useMapSymbology();

  const featuresWithSamples = features.reduce((acc, feature) => {
    return feature.properties?.samples && feature.properties.samples.length >= 1 ? [...acc, feature] : acc;
  }, []);

  if (isShowSamplesOn) {
    return (
      <>
        {/* Starburst at Point Features with a Sample Layer */}
        <Source
          id={'pointFeaturesSamplesSource'}
          type={'geojson'}
          data={turf.featureCollection(featuresWithSamples)}
        >
          <Layer
            type={'symbol'}
            beforeId={'polygonLayerNotSelected'}
            id={'pointLayerSampleSymbols'}
            minZoomLevel={1}
            filter={['==', ['geometry-type'], 'Point']}
            layout={getLayoutSymbology().sample}
            paint={getPaintSymbology().sample}
          />
        </Source>
      </>
    );
  }
};

export default SampleLayers;
