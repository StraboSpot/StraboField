import React from 'react';

import {ListItem, Overlay} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import ModalWrapperHeader from './ModalWrapperHeader';
import overlayStyles from './overlay.styles';
import {SHORTCUT_MODALS} from '../../../modules/page/page.constants';
import commonStyles from '../../common.styles';
import {isEmpty} from '../../Helpers';
import {SMALL_SCREEN} from '../../styles.constants';
import {AvatarWrapper} from '../avatars';
import ModalSaveAndCancelButtons from '../modals/ModalSaveAndCancelButtons';
import {KeyboardAvoidingView} from 'react-native';

const ModalWrapper = ({
                        actionTitle,
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

  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const getResponsiveOverlayStyle = () => {
    if (fullscreen || SMALL_SCREEN) return overlayStyles.overlayContainerFullScreen;
    return {...overlayStyles.overlayContainer, ...overlayStyleOverride};
  };

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

  return (
    <Overlay
      animationType={'fade'}
      backdropStyle={overlayStyles.backdropStyles}
      fullScreen={fullscreen || SMALL_SCREEN}
      isVisible={isVisible}
      onBackdropPress={onBackdropPress}
      overlayStyle={getResponsiveOverlayStyle()}
      supportedOrientations={['portrait', 'landscape']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Adjust offset as needed
        style={{flex: 1}} // Important for padding behavior
      >
        <ModalWrapperHeader
          buttonTitleRight={buttonTitleRight}
          closeModal={closeModal}
          headerTitle={headerTitle}
          showCloseButton={showCloseButton}
        />
        {children}
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
      </KeyboardAvoidingView>
    </Overlay>
  );
};

export default React.memo(ModalWrapper);
