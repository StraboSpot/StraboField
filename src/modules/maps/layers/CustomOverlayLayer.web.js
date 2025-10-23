import React, {useEffect, memo} from 'react';

import {Layer, Source} from 'react-map-gl';

import useMapURL from '../useMapURL';

const CustomOverlayLayer = ({customMap}) => {

  const {buildTileURL} = useMapURL();

  useEffect(() => {
    return () => {
      // Cleanup: Log when component unmounts for debugging
      console.log('CustomMapLayer (web) unmounting for map:', customMap.id);
    };
  }, [customMap.id]);

  // Defensive check to ensure customMap is valid
  if (!customMap || !customMap.id) {
    console.warn('CustomMapLayer: Invalid customMap provided', customMap);
    return null;
  }

  return (
    <Source
      id={customMap.id}
      key={customMap.id}
      tiles={[buildTileURL(customMap)]}
      type={'raster'}
    >
      <Layer
        // beforeId={'pointLayerSelectedHalo'}
        id={customMap.id + 'Layer'}
        paint={{
          'raster-opacity': customMap.opacity && parseFloat(customMap.opacity.toString())
          && parseFloat(customMap.opacity.toString()) >= 0 && parseFloat(customMap.opacity.toString()) <= 1
            ? parseFloat(customMap.opacity.toString()) : 1,
        }}
        type={'raster'}
      />
    </Source>
  );
};

export default memo(CustomOverlayLayer);
