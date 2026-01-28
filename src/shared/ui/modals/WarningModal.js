import React from 'react';
import {Dimensions, Platform, ScrollView, Text} from 'react-native';

import {Overlay} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import ModalSaveAndCancelButtons from './ModalSaveAndCancelButtons';
import ModalWrapperHeader from './ModalWrapperHeader';
import overlayStyles from './overlay.styles';
import {setIsWarningMessagesModalVisible} from '../../../modules/home/home.slice';
import * as themes from '../../styles.constants';

const platform = Platform.OS === 'ios' ? 'window' : 'screen';
const {height} = Dimensions.get(platform);

const WarningModal = ({
                        cancelTitle,
                        children,
                        closeModal,
                        confirmText,
                        isVisible,
                        onCancelPress,
                        onConfirmPress,
                        showCancelButton,
                        showCloseButton,
                        showConfirmButton,
                        title,
                      }) => {
  const dispatch = useDispatch();
  const isWarningModalVisible = useSelector(state => state.home.isWarningMessagesModalVisible);
  const statusMessages = useSelector(state => state.home.statusMessages);

  const closeWarningModal = () => {
    dispatch(setIsWarningMessagesModalVisible(false));
  };

  return (
    <Overlay
      animationType={'fade'}
      backdropStyle={{opacity: 0.5, backgroundColor: 'black'}}
      isVisible={isVisible || isWarningModalVisible}
      overlayStyle={{
        backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
        borderColor: themes.MEDIUMGREY,
        borderRadius: themes.MODAL_BORDER_RADIUS,
        borderWidth: 0.5,
        elevation: 5,
        maxHeight: height * 0.8,
        shadowOpacity: 0.3,
        shadowRadius: 4,
        width: 300,
      }}
      supportedOrientations={['portrait', 'landscape']}
    >
      <ModalWrapperHeader
        closeModal={closeModal || closeWarningModal}
        headerTitle={title || 'Warning!'}
        showCloseButton={showCloseButton}
      />
      <ScrollView>
        <Text style={overlayStyles.statusMessageText}>{children || statusMessages.join('\n')}</Text>
      </ScrollView>
      <ModalSaveAndCancelButtons
        actionTitle={confirmText || 'Ok'}
        cancelTitle={cancelTitle || 'Cancel'}
        onActionPressed={onConfirmPress || closeWarningModal}
        onCancelPress={onCancelPress}
        showActionButton={showConfirmButton}
        showCancelButton={showCancelButton}
      />
    </Overlay>
  );
};

export default WarningModal;
