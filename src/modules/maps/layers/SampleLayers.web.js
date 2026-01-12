import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';
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
