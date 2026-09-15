import React from 'react';
import {View} from 'react-native';

import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {SpotsListItem} from '../../spots';

// Modal shown when a map press overlaps more than one Spot, letting the user pick which one to act
// on (select in view mode, or choose which to edit on a long press).
const SelectSpotsAtPressModal = ({closeModal, headerTitle, isVisible, onSpotPress, spots}) => {
  /* Event Handlers */

  const handleSpotPressed = (spot) => {
    onSpotPress(spot);
    closeModal();
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={closeModal}
      headerTitle={headerTitle}
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
