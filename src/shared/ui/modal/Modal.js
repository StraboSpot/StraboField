import React from 'react';

import {Button, ListItem, Overlay} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import ModalHeader from './ModalHeader';
import compassStyles from '../../../modules/compass/compass.styles';
import overlayStyles from '../../../modules/home/overlays/overlay.styles';
import {MODAL_KEYS, NOTEBOOK_MODELS, SHORTCUT_MODALS} from '../../../modules/page/page.constants';
import commonStyles from '../../common.styles';
import {isEmpty} from '../../Helpers';
import {SMALL_SCREEN} from '../../styles.constants';
import {AvatarWrapper} from '../avatars';
import {useWindowSize} from '../useWindowSize';

const Modal = ({
                 buttonTitleLeft,
                 buttonTitleRight,
                 cancel,
                 children,
                 closeModal,
                 isFullScreen,
                 onPress,
                 title,
               }) => {

  const {height, width} = useWindowSize();

  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

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
            title={'View In Shortcut Mode'}
            type={'clear'}
            titleStyle={compassStyles.buttonTitleStyle}
            onPress={() => onPress(shortcutModalSwitch.key)}
          />
        );
      }
    }
  };

  return (
    <Overlay
      supportedOrientations={['portrait', 'landscape']}
      isVisible={modalVisible === MODAL_KEYS.NOTEBOOK.MEASUREMENTS
        || modalVisible === MODAL_KEYS.SHORTCUTS.MEASUREMENT || modalVisible === MODAL_KEYS.NOTEBOOK.REPORTS
        || SMALL_SCREEN || isFullScreen}
      overlayStyle={SMALL_SCREEN || isFullScreen ? overlayStyles.overlayContainerFullScreen : {
        ...overlayStyles.overlayContainer,
        maxHeight: height * 0.80,
        width: modalVisible === MODAL_KEYS.NOTEBOOK.REPORTS ? width * 0.80 : 300,
      }}
      fullScreen={SMALL_SCREEN || isFullScreen}
      animationType={'slide'}
      backdropStyle={{backgroundColor: 'transparent'}}
    >
      <ModalHeader
        buttonTitleLeft={buttonTitleLeft}
        buttonTitleRight={buttonTitleRight}
        cancel={cancel}
        closeModal={closeModal}
        title={title}
      />
      {children}
      {!isEmpty(selectedSpot) && isEmpty(selectedAttributes) && renderModalBottom()}
    </Overlay>
  );
};

export default Modal;
