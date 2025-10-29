import React from 'react';

import {useDispatch} from 'react-redux';

import SamplesList from './SamplesList';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {setSelectedAttributes} from '../spots/spots.slice';

const SamplesOverview = ({page}) => {
  const dispatch = useDispatch();

  const onPressed = (item) => {
    dispatch(setSelectedAttributes([item]));
    dispatch(setNotebookPageVisible(page.key));
  };

  return (
    <SamplesList onPress={onPressed}/>
  );
};

export default SamplesOverview;
