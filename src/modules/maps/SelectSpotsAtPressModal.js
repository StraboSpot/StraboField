import React from 'react';
import {View} from 'react-native';

import {useDispatch} from 'react-redux';

import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {SpotsListItem} from '../spots';
import {setSelectedSpot} from '../spots/spots.slice';

// Modal shown when a map press overlaps more than one Spot, letting the user pick which to select.
const SelectSpotsAtPressModal = ({closeModal, isVisible, spots}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  /* Event Handlers */

  const handleSpotPressed = (spot) => {
    dispatch(setSelectedSpot(spot));
    closeModal();
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={closeModal}
      headerTitle={`${spots.length} Spots Here`}
      isVisible={isVisible}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <View>
        {spots.map((spot, index) => (
          <React.Fragment key={spot.properties.id.toString()}>
            {index > 0 && <FlatListItemSeparator/>}
            <SpotsListItem
              doShowTags={true}
              onPress={handleSpotPressed}
              spot={spot}
            />
          </React.Fragment>
        ))}
      </View>
    </ModalWrapper>
  );
};

export default SelectSpotsAtPressModal;
