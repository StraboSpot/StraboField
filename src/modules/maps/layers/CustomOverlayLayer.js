import React, {useEffect, memo} from 'react';

import MapboxGL from '@rnmapbox/maps';

import useMapURL from '../useMapURL';

const CustomOverlayLayer = ({basemap, customMap}) => {

  const {buildTileURL} = useMapURL();

  useEffect(() => {
    console.log('CustomOverlayLayer mounted/updated for map:', customMap.id, 'isViewable:', customMap.isViewable);
    return () => {
      // Cleanup: When component unmounts, the layer should be automatically removed by React
      // But we can add explicit cleanup if needed
      console.log('CustomOverlayLayer unmounting for map:', customMap.id);
    };
  }, [customMap.id, customMap.isViewable]);

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

// Custom comparison function to ensure re-renders when relevant props change
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.customMap.id === nextProps.customMap.id &&
    prevProps.customMap.isViewable === nextProps.customMap.isViewable &&
    prevProps.customMap.opacity === nextProps.customMap.opacity &&
    prevProps.basemap.id === nextProps.basemap.id
  );
};

export default memo(CustomOverlayLayer, areEqual);
