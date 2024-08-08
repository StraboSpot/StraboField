import React from 'react';

import {useSelector} from 'react-redux';

import TablesData from './TablesData';
import UrlData from './URLData';
import {isEmpty} from '../../shared/Helpers';

const DataOverview = () => {
  const spot = useSelector(state => state.spot.selectedSpot);
  return (
    <>
      {!isEmpty(spot.properties?.data?.urls) && <UrlData spot={spot} editable={false}/>}
      {!isEmpty(spot.properties?.data?.tables) && <TablesData spot={spot} editable={false}/>}
    </>
  );
};

export default DataOverview;
