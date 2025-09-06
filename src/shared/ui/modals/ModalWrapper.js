import React from 'react';

import {Button, ListItem, Overlay} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import ModalWrapperHeader from './ModalWrapperHeader';
import overlayStyles from './overlay.styles';
import compassStyles from '../../../modules/compass/compass.styles';
import {MODAL_KEYS, NOTEBOOK_MODELS, SHORTCUT_MODALS} from '../../../modules/page/page.constants';
import commonStyles from '../../common.styles';
import {isEmpty} from '../../Helpers';
import {SMALL_SCREEN} from '../../styles.constants';
import {AvatarWrapper} from '../avatars';
import ModalSaveAndCancelButtons from '../modals/ModalSaveAndCancelButtons';

const ModalWrapper = ({
                        buttonTitleLeft,
                        buttonTitleRight,
                        cancel,
                        children,
                        closeModal,
                        disabled,
                        isFullScreen,
                        isVisible,
                        onCancelPress,
                        onDeletePress,
                        onPress,
                        onActionPressed,
                        overlayStyleOverride,
                        headerTitle,
                        actionTitle,
                        hideActionButton,
                        shouldShowButtons,
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
          onPress={() => onPress(shortcutModal.notebook_modal_key)}
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
    else if (notebookModal) {
      const shortcutModalSwitch = SHORTCUT_MODALS.find(m => m.notebook_modal_key === modalVisible);
      if (shortcutModalSwitch) {
        return (
          <Button
            onPress={() => onPress(shortcutModalSwitch.key)}
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
      fullScreen={SMALL_SCREEN}
      isVisible={modalVisible === MODAL_KEYS.NOTEBOOK.MEASUREMENTS
        || modalVisible === MODAL_KEYS.SHORTCUTS.MEASUREMENT || modalVisible === MODAL_KEYS.NOTEBOOK.REPORTS
        || SMALL_SCREEN || isFullScreen || isVisible}
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
      {shouldShowButtons && (
        <ModalSaveAndCancelButtons
          actionTitle={actionTitle}
          disabled={disabled}
          hideActionButton={hideActionButton}
          onActionPressed={onActionPressed}
          onCancelPress={onCancelPress}
          onDeletePress={onDeletePress}
          showDeleteButton={showDeleteButton}/>
      )}
    </Overlay>
  );
};

export default ModalWrapper;
