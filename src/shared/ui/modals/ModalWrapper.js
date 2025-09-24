import React from 'react';

import {Button, ListItem, Overlay} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import ModalWrapperHeader from './ModalWrapperHeader';
import overlayStyles from './overlay.styles';
import compassStyles from '../../../modules/compass/compass.styles';
import {NOTEBOOK_MODELS, SHORTCUT_MODALS} from '../../../modules/page/page.constants';
import commonStyles from '../../common.styles';
import {isEmpty} from '../../Helpers';
import {SMALL_SCREEN} from '../../styles.constants';
import {AvatarWrapper} from '../avatars';
import ModalSaveAndCancelButtons from '../modals/ModalSaveAndCancelButtons';

const ModalWrapper = ({
                        actionTitle,
                        buttonTitleLeft,
                        buttonTitleRight,
                        cancel,
                        cancelTitle,
                        children,
                        closeModal,
                        disabled,
                        fullscreen,
                        headerTitle,
                        isLoading,
                        isVisible,
                        onActionPressed,
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
    if (SMALL_SCREEN) return overlayStyles.overlayContainerFullScreen;
    return {
      ...overlayStyles.overlayContainer,
      ...overlayStyleOverride,
    };
  };

  const renderModalBottom = () => {
    const shortcutModal = SHORTCUT_MODALS.find(m => m.key === modalVisible);
    const notebookModal = NOTEBOOK_MODELS.find(m => m.key === modalVisible);

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
    else if (notebookModal && !SMALL_SCREEN) {
      const shortcutModalSwitch = SHORTCUT_MODALS.find(m => m.notebook_modal_key === modalVisible);
      if (shortcutModalSwitch) {
        return (
          <Button
            onPress={() => onFooterButtonPress(shortcutModalSwitch.key)}
            title={'View In Shortcut Mode'}
            titleStyle={compassStyles.buttonTitleStyle}
            type={'clear'}
          />
        );
      }
    }
  };

  return (
    <Overlay
      animationType={'fade'}
      backdropStyle={overlayStyles.backdropStyles}
      fullScreen={fullscreen || SMALL_SCREEN}
      isVisible={isVisible}
      overlayStyle={getResponsiveOverlayStyle()}
      supportedOrientations={['portrait', 'landscape']}
    >
      <ModalWrapperHeader
        buttonTitleLeft={buttonTitleLeft}
        buttonTitleRight={buttonTitleRight}
        cancel={cancel}
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
    </Overlay>
  );
};

export default React.memo(ModalWrapper);
