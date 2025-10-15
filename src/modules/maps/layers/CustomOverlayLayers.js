import React from 'react';

import {useSelector} from 'react-redux';

import {CustomOverlayLayer} from '.';

const CustomOverlayLayers = ({basemap}) => {

  const {customMaps} = useSelector(state => state.map);

  return (
    Object.values(customMaps)
      .filter(customMap => customMap && customMap.id && customMap.overlay && customMap.isViewable)
      .map(customMap => (
        <CustomOverlayLayer basemap={basemap} customMap={customMap} key={customMap.id}/>
      ))
  );
};

export default CustomOverlayLayers;
