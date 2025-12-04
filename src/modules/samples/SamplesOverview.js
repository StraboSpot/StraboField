import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import SamplesList from './SamplesList';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/page.constants';
import {setSelectedAttributes, setSelectedSpot} from '../spots/spots.slice';

const SamplesOverview = ({page}) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

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

  return (
    <SamplesList onPress={onPressed}/>
  );
};

export default SamplesOverview;
