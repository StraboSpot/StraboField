import React, {useEffect, memo} from 'react';

import MapboxGL from '@rnmapbox/maps';

import useMapURL from '../useMapURL';

const CustomOverlayLayer = ({basemap, customMap}) => {

  const {buildTileURL} = useMapURL();

  useEffect(() => {
    return () => {
      // Cleanup: When component unmounts, the layer should be automatically removed by React
      // But we can add explicit cleanup if needed
      console.log('CustomOverlayLayer unmounting for map:', customMap.id);
    };
  }, [customMap.id]);

  // Defensive checks to ensure customMap and basemap are valid
  if (!customMap || !customMap.id) {
    console.warn('CustomOverlayLayer: Invalid customMap provided', customMap);
    return null;
  }

  if (!basemap || !basemap.id) {
    console.warn('CustomOverlayLayer: Invalid basemap provided', basemap);
    return null;
  }

  return (
    <MapboxGL.RasterSource
      id={customMap.id}
      key={customMap.id}
      tileUrlTemplates={[buildTileURL(customMap)]}
    >
      <MapboxGL.RasterLayer
        aboveLayerID={basemap.id}
        id={customMap.id + 'Layer'}
        key={customMap.id + 'Layer'}
        sourceID={customMap.id}
        style={{
          rasterOpacity: customMap.opacity && parseFloat(customMap.opacity.toString())
          && parseFloat(customMap.opacity.toString()) >= 0 && parseFloat(customMap.opacity.toString()) <= 1
            ? parseFloat(customMap.opacity.toString()) : 1,
          visibility: 'visible',
        }}
      />
    </MapboxGL.RasterSource>
  );
};

export default memo(CustomOverlayLayer);
