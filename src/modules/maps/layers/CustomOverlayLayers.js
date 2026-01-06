import React, {useMemo} from 'react';

import {useSelector} from 'react-redux';

import {CustomOverlayLayer} from '.';

const CustomOverlayLayers = ({basemap}) => {

  const customMaps = useSelector(state => state.map.customMaps);

  // Use useMemo to ensure we get a new array reference when isViewable changes
  const visibleOverlays = useMemo(() => {
    const overlays = Object.values(customMaps)
      .filter(customMap => customMap && customMap.id && customMap.overlay && customMap.isViewable);

    console.log('CustomOverlayLayers filtering overlays. Total maps:', Object.keys(customMaps).length);
    console.log('Visible overlays:', overlays.map(m => `${m.id} (isViewable: ${m.isViewable})`));

    return overlays;
  }, [customMaps]);

  return (
    <>
      {visibleOverlays.map(customMap => (
        <CustomOverlayLayer
          basemap={basemap}
          customMap={customMap}
          key={`overlay-${customMap.id}-${customMap.isViewable}`}
        />
      ))}
    </>
  );
};

export default CustomOverlayLayers;
