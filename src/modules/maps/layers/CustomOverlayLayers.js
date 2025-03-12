import React from 'react';

import {useSelector} from 'react-redux';

import {CustomOverlayLayer} from '.';

const CustomOverlayLayers = ({basemap}) => {

  const {customMaps} = useSelector(state => state.map);

  return (
    Object.values(customMaps).map((customMap) => {
      return customMap.overlay && customMap.isViewable && (
        <CustomOverlayLayer basemap={basemap} key={customMap.id} customMap={customMap}/>
      );
    })
  );
};

export default CustomOverlayLayers;
