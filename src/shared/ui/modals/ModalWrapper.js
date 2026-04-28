import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FlatList, Keyboard, Modal, Platform, View} from 'react-native';

import {ListItem, Overlay} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import ModalWrapperHeader from './ModalWrapperHeader';
import overlayStyles from './overlay.styles';
import {SHORTCUT_MODALS} from '../../../modules/page/page.constants';
import commonStyles from '../../common.styles';
import {isEmpty} from '../../helpers';
import {MODAL_WIDTH, SMALL_SCREEN} from '../../styles.constants';
import {AvatarWrapper} from '../avatars';
import ModalSaveAndCancelButtons from '../modals/ModalSaveAndCancelButtons';

const ModalWrapper = ({
                        actionTitle,
                        backdropStyle,
                        buttonTitleRight,
                        cancelTitle,
                        children,
                        closeModal,
                        disabled,
                        fullscreen,
                        headerTitle,
                        isLoading,
                        isVisible,
                        onActionPressed,
                        onBackdropPress,
                        onCancelPress,
                        onDeletePress,
                        onFooterButtonPress,
                        overlayStyleOverride,
                        showActionButton,
                        showCancelButton,
                        showCloseButton,
                        showDeleteButton,
                      }) => {
  /* Data Hooks */

  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  /* Local State */

  const childrenRef = useRef(children);
  childrenRef.current = children;
  const [kbOffset, setKbOffset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android' || !SMALL_SCREEN) return;
    const show = Keyboard.addListener('keyboardDidShow', e => setKbOffset(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbOffset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  /* Derived Variables */

  const isAutoHeight = overlayStyleOverride?.height === 'auto';

  /* Logic Helpers */

  const getResponsiveOverlayStyle = () => {
    if (fullscreen) return overlayStyles.overlayContainerFullScreen;
    return {...overlayStyles.overlayContainer, ...overlayStyleOverride, minWidth: MODAL_WIDTH};
  };

  /* Render Functions */

  const renderListHeader = useCallback(() => <>{childrenRef.current}</>, []);

  const renderModalBottom = () => {
    const shortcutModal = SHORTCUT_MODALS.find(m => m.key === modalVisible);

    if (shortcutModal && shortcutModal.notebook_modal_key) {
      return (
        <ListItem
          containerStyle={commonStyles.listItem}
          onPress={() => onFooterButtonPress(shortcutModal.notebook_modal_key)}
        >
          <AvatarWrapper
            size={20}
            source={require('../../../assets/icons/NotebookView_pressed.png')}
          />
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>Go to Last Spot Created</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron/>
        </ListItem>
      );
    }
  };

  const renderModalContent = () => (
    <>
      <ModalWrapperHeader
        buttonTitleRight={buttonTitleRight}
        closeModal={closeModal}
        headerTitle={headerTitle}
        showCloseButton={showCloseButton}
      />
      <FlatList
        ListHeaderComponent={renderListHeader}
        data={[]}
        keyExtractor={(item, index) => index.toString()}
        keyboardShouldPersistTaps={'handled'}
        style={isAutoHeight ? undefined : {flex: 1}}
      />
      {!isEmpty(selectedSpot) && isEmpty(selectedAttributes) && renderModalBottom()}
      <ModalSaveAndCancelButtons
        actionTitle={actionTitle}
        cancelTitle={cancelTitle}
        disabled={disabled}
        isLoading={isLoading}
        onActionPressed={onActionPressed}
        onCancelPress={onCancelPress}
        onDeletePress={onDeletePress}
        showActionButton={showActionButton}
        showCancelButton={showCancelButton}
        showDeleteButton={showDeleteButton}
      />
    </>
  );

  /* View */

  if (SMALL_SCREEN) {
    return (
      <Modal
        animationType={'fade'}
        onRequestClose={onBackdropPress}
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape']}
        visible={isVisible}
      >
        <View style={[overlayStyles.overlayContainerFullScreen, {paddingBottom: kbOffset}]}>
          {renderModalContent()}
        </View>
      </Modal>
    );
  }

  return (
    <Overlay
      animationType={'fade'}
      backdropStyle={backdropStyle || overlayStyles.backdropStyles}
      fullScreen={fullscreen}
      isVisible={isVisible}
      onBackdropPress={onBackdropPress}
      overlayStyle={getResponsiveOverlayStyle()}
      supportedOrientations={['portrait', 'landscape']}
    >
      {renderModalContent()}
    </Overlay>
  );
};

export default React.memo(ModalWrapper);
