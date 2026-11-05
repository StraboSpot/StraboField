import React from 'react';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch} from 'react-redux';

import ImagesInSpot from './ImagesInSpot';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {editedSpotImages} from '../spots/spots.slice';

const ImagesOverview = ({isReadOnly, onOpenImage, onOpenImageProperties, page}) => {
  console.log('Rendering ImagesOverview...');

  /* Data Hooks */

  const dispatch = useDispatch();

  const toast = useToast();

  /* Logic Helpers */

  const saveImagesToSpot = (newImages) => {
    dispatch(editedSpotImages(newImages));
    toast.show(`${newImages.length} image(s) saved!`, {type: 'success', duration: 1500});
  };

  /* View */

  return (
    <ImagesInSpot
      isReadOnly={isReadOnly}
      onOpenImage={onOpenImage}
      onOpenImageProperties={onOpenImageProperties}
      onPressEmpty={() => dispatch(setNotebookPageVisible(page.key))}
      saveImages={saveImagesToSpot}
    />
  );
};

export default ImagesOverview;
