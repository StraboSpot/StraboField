import React from 'react';
import {FlatList, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch} from 'react-redux';

import AddImageButtons from './AddImageButtons';
import ImagesInSpot from './ImagesInSpot';
import PageHeader from '../page/PageHeader';
import {editedSpotImages} from '../spots/spots.slice';

const ImagesPage = ({isReadOnly, page}) => {
  console.log('Rendering ImagesPage...');

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
    <View style={{flex: 1}}>
      <PageHeader pageTitle={page.label}/>
      <FlatList
        ListHeaderComponent={
          <>
            {!isReadOnly && <AddImageButtons saveImages={saveImagesToSpot}/>}
            <ImagesInSpot isReadOnly={isReadOnly} saveImages={saveImagesToSpot}/>
          </>
        }
        ListHeaderComponentStyle={{width: '100%'}}
        contentContainerStyle={{alignItems: 'center', paddingBottom: 40}}
        keyboardShouldPersistTaps='handled'
      />
    </View>
  );
};

export default ImagesPage;
