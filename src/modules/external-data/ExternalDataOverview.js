import React from 'react';

import {useSelector} from 'react-redux';

import TablesData from './TablesData';
import URLData from './URLData';
import {isEmpty} from '../../shared/helpers';

const ExternalDataOverview = () => {
  /* Data Hooks */

  const spot = useSelector(state => state.spot.selectedSpot);

  /* View */

  return (
    <>
      {!isEmpty(spot.properties?.data?.urls) && <URLData editable={false} spot={spot}/>}
      {!isEmpty(spot.properties?.data?.tables) && <TablesData editable={false} spot={spot}/>}
    </>
  );
};

export default ExternalDataOverview;
