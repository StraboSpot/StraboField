import React from 'react';
import {KeyboardAvoidingView, Platform, ScrollView} from 'react-native';

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

  /* Derived Variables */

  const isAutoHeight = overlayStyleOverride?.height === 'auto';

  /* Logic Helpers */

  const getResponsiveOverlayStyle = () => {
    if (fullscreen || SMALL_SCREEN) return overlayStyles.overlayContainerFullScreen;
    return {...overlayStyles.overlayContainer, ...overlayStyleOverride};
  };

  /* Render Functions */

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

  /* View */

  return (
    <Overlay
      animationType={'fade'}
      backdropStyle={backdropStyle || overlayStyles.backdropStyles}
      fullScreen={fullscreen || SMALL_SCREEN}
      isVisible={isVisible}
      onBackdropPress={onBackdropPress}
      overlayStyle={getResponsiveOverlayStyle()}
      supportedOrientations={['portrait', 'landscape']}
    >
      <KeyboardAvoidingView
        behavior={'padding'}
        enabled={Platform.OS === 'ios'}
        style={isAutoHeight ? undefined : {flex: 1, minHeight: 0}}
      >
        <ModalWrapperHeader
          buttonTitleRight={buttonTitleRight}
          closeModal={closeModal}
          headerTitle={headerTitle}
          showCloseButton={showCloseButton}
        />
        <ScrollView
          automaticallyAdjustContentInsets={Platform.OS === 'ios'}
          contentContainerStyle={isAutoHeight ? undefined : {flexGrow: 1, minHeight: 0}}
          keyboardShouldPersistTaps={'handled'}
        >
          {/*<View style={isAutoHeight ? undefined : {flex: 1, minHeight: 0}}>*/}
          {children}
          {/*</View>*/}
        </ScrollView>
        {!isEmpty(selectedSpot) && isEmpty(selectedAttributes) && renderModalBottom()}
      </KeyboardAvoidingView>
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
