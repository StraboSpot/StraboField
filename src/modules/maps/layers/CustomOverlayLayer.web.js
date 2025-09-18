import React from 'react';

import {Layer, Source} from 'react-map-gl';

import useMapURL from '../useMapURL';

const CustomMapLayer = ({basemap, customMap}) => {

  const {buildTileURL} = useMapURL();

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

export default CustomMapLayer;
