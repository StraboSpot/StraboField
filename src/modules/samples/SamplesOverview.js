import React from 'react';

import {useDispatch} from 'react-redux';

import SamplesList from './SamplesList';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {setSelectedAttributes} from '../spots/spots.slice';

const SamplesOverview = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  /* Event Handlers */

  const onPressed = (item) => {
    dispatch(setSelectedAttributes([item]));
    dispatch(setNotebookPageVisible(page.key));
  };

  /* View */

  return (
    <SamplesList onPress={onPressed}/>
  );
};

export default SamplesOverview;
