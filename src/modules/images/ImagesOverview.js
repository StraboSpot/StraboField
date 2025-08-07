import React from 'react';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {ImagesInSpot} from '.';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotImages} from '../spots/spots.slice';

const ImagesOverview = () => {
  console.log('Rendering ImagesOverview...');

  const dispatch = useDispatch();
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const toast = useToast();

  const saveImagesToSpot = (newImages) => {
    dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot?.properties?.id]));
    dispatch(editedSpotImages(newImages));
    toast.show(`${newImages.length} image(s) saved!`, {type: 'success', duration: 1500});
  };

  return <ImagesInSpot saveImages={saveImagesToSpot}/>;
};

export default ImagesOverview;
