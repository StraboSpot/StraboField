import React from 'react';
import {Text, View} from 'react-native';

import commonStyles from '../../../shared/common.styles';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import SpotsListItem from '../../spots/SpotsListItem';
import {getSpotsAtPressInListOrder} from '../maps.helpers';

// Modal letting the user pick which of several Spots at a map press to act on: to select, when no one of them is
// plainly meant (see getSpotMeantAtPress), or to edit, which always asks. Lists the likeliest first.
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
      <Text style={[commonStyles.standardDescriptionText, {padding: 10, textAlign: 'center'}]}>
        There are {spots.length} Spots at this point on the map.
      </Text>
      <View>
        {getSpotsAtPressInListOrder(spots).map((spot, index) => (
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
