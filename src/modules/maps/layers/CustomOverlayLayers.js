import React from 'react';

import {useSelector} from 'react-redux';

import CustomOverlayLayer from './CustomOverlayLayer';
import {getVisibleCustomOverlays} from '../custom-maps/customMaps.helpers';
import {isPreviewedMap} from '../offline-maps/offlineMaps.helpers';
import useMapURL from '../useMapURL';

const CustomOverlayLayers = ({basemap}) => {
  /* Data Hooks */

  const customMaps = useSelector(state => state.map.customMaps);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const previewedOfflineMapId = useSelector(state => state.offlineMap.previewedOfflineMapId);

  const {buildOverlayTileURL} = useMapURL();

  /* Derived State */

  // A previewed map is not drawn over itself: its live tiles would hide the gaps the preview is there to show. An
  // overlay with no tiles to draw - none reachable and none downloaded - is left off until it has some, and stays
  // switched on meanwhile.
  const overlaysToDraw = getVisibleCustomOverlays(customMaps, offlineMaps)
    .filter(map => !isPreviewedMap(map, previewedOfflineMapId))
    .map(map => ({map: map, tileUrlTemplate: buildOverlayTileURL(map)}))
    .filter(({tileUrlTemplate}) => tileUrlTemplate);

  /* View */

  return (
    <>
      {overlaysToDraw.map(({map, tileUrlTemplate}) => (
        <CustomOverlayLayer
          basemap={basemap}
          customMap={map}
          key={`overlay-${map.id}`}
          tileUrlTemplate={tileUrlTemplate}
        />
      ))}
    </>
  );
};

export default CustomOverlayLayers;
