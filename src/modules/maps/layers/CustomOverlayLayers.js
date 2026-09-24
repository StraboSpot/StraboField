import React, {useMemo} from 'react';

import {useSelector} from 'react-redux';

import CustomOverlayLayer from './CustomOverlayLayer';
import {getVisibleCustomOverlays} from '../custom-maps/customMaps.helpers';
import useMapURL from '../useMapURL';

const CustomOverlayLayers = ({basemap}) => {
  /* Data Hooks */

  const customMaps = useSelector(state => state.map.customMaps);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);

  const {buildOverlayTileURL} = useMapURL();

  /* Derived State */

  const visibleOverlays = useMemo(() => getVisibleCustomOverlays(customMaps, offlineMaps), [customMaps, offlineMaps]);

  /* View */

  return (
    <>
      {visibleOverlays.map(customMap => (
        <CustomOverlayLayer
          basemap={basemap}
          customMap={customMap}
          key={`overlay-${customMap.id}`}
          tileUrlTemplate={buildOverlayTileURL(customMap)}
        />
      ))}
    </>
  );
};

export default CustomOverlayLayers;
