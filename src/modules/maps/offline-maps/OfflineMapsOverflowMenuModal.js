import React, {useRef} from 'react';
import {Platform} from 'react-native';

import {ListItem} from '@rn-vui/base';

import commonStyles from '../../../shared/common.styles';
import {MEDIUMGREY, SMALL_SCREEN} from '../../../shared/styles.constants';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import tagStyles from '../../tags/tags.styles';

const OfflineMapsOverflowMenuModal = ({
                                        closeMenu,
                                        isDownloadDisabled,
                                        isVisible,
                                        onDownloadPress,
                                        onFindMapsPress,
                                      }) => {
  /* Local State */

  // On iOS the picked action waits for the menu to finish dismissing, since a modal presented during that is
  // dropped. onDismiss only fires on iOS, so elsewhere the action runs straight away.
  const pickedActionRef = useRef(null);

  /* Event Handlers */

  const handleDismiss = () => {
    pickedActionRef.current?.();
    pickedActionRef.current = null;
  };

  const handleItemPressed = (action) => {
    closeMenu();
    if (Platform.OS === 'ios') pickedActionRef.current = action;
    else action();
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={closeMenu}
      headerTitle={'Offline Map Options'}
      isVisible={isVisible}
      onBackdropPress={closeMenu}
      onDismiss={handleDismiss}
      overlayStyleOverride={tagStyles.overflowMenuModal}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={SMALL_SCREEN}
    >
      <ListItem
        bottomDivider
        containerStyle={commonStyles.listItem}
        disabled={isDownloadDisabled}
        onPress={() => handleItemPressed(onDownloadPress)}
      >
        <ListItem.Title style={[commonStyles.listItemTitle, isDownloadDisabled && {color: MEDIUMGREY}]}>
          {'Download Tiles of Current Map'}
        </ListItem.Title>
      </ListItem>
      <ListItem containerStyle={commonStyles.listItem} onPress={() => handleItemPressed(onFindMapsPress)}>
        <ListItem.Title style={commonStyles.listItemTitle}>{'Find Offline Maps on Device'}</ListItem.Title>
      </ListItem>
    </ModalWrapper>
  );
};

export default OfflineMapsOverflowMenuModal;
