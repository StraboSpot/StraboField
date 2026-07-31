import React from 'react';
import {FlatList, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {AddImageButtons, ImagesInSpot} from '.';
import PageHeader from '../page/PageHeader';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotImages} from '../spots/spots.slice';

const ImagesPage = ({isReadOnly}) => {
  console.log('Rendering ImagesPage...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const toast = useToast();

  /* Logic Helpers */

  const saveImagesToSpot = (newImages) => {
    dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot?.properties?.id]));
    dispatch(editedSpotImages(newImages));
    toast.show(`${newImages.length} image(s) saved!`, {type: 'success', duration: 1500});
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={'Images'}/>
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
