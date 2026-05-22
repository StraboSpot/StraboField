import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import SampleDetailOverview from './SampleDetailOverview';
import SamplesList from './SamplesList';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedAttributes, setSelectedSpot} from '../spots/spots.slice';

const SamplesOverview = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Event Handlers */

  const onPressed = (item) => {
    if (item.properties?.isSample && !spot.properties?.isSample) {
      dispatch(setSelectedSpot(item));
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    else {
      dispatch(setSelectedAttributes([item]));
      dispatch(setNotebookPageVisible(page.key));
    }
  };

  /* View */

  if (spot.properties?.isSample) return <SampleDetailOverview/>;
  return <SamplesList isShowIGSN onPress={onPressed} onPressEmpty={() => dispatch(setNotebookPageVisible(page.key))}/>;
};

export default SamplesOverview;
