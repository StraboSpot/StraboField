import React from 'react';
import {View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {AddImageButtons, ImagesInSpot} from '.';
import NotebookPageHeader from '../notebook-panel/NotebookPageHeader';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotImages} from '../spots/spots.slice';

const ImagesPage = ({isReadOnly}) => {
  console.log('Rendering ImagesPage...');

  const dispatch = useDispatch();
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const toast = useToast();

  const saveImagesToSpot = (newImages) => {
    dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot?.properties?.id]));
    dispatch(editedSpotImages(newImages));
    toast.show(`${newImages.length} image(s) saved!`, {type: 'success', duration: 1500});
  };

  return (
    <View style={{flex: 1}}>
      <NotebookPageHeader pageTitle={'Images'}/>
      <View style={{alignItems: 'center', flex: 1}}>
        {!isReadOnly && <AddImageButtons saveImages={saveImagesToSpot}/>}
        <ImagesInSpot isReadOnly={isReadOnly} saveImages={saveImagesToSpot}/>
      </View>
    </View>
  );
};

export default ImagesPage;
