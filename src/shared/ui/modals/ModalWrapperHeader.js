import React from 'react';
import {Text, View} from 'react-native';

import {Image} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import modalStyles from './modal.styles';
import {MODALS} from '../../../modules/page/page.constants';
import CloseButton from '../buttons/CloseButton';

const ModalWrapperHeader = ({
                              buttonTitleRight,
                              closeModal,
                              showCloseButton = false,
                              headerTitle,
                              headerImage,
                              imageStyle,
                            }) => {
  /* Data Hooks */

  const activeModal = useSelector(state => state.home.activeModal);

  /* Derived Variables */

  const modalInfo = MODALS.find(p => p.key === activeModal);

  /* Logic Helpers */

  const getTitle = () => modalInfo && (modalInfo.action_label || modalInfo.label);

  /* View */

  return (
    <View style={modalStyles.modalTop}>
      <View style={modalStyles.modalHeaderContainer}>
        {showCloseButton && (
          <View style={modalStyles.modalHeaderButtonsContainer}>
            <CloseButton
              onPress={closeModal}
              title={buttonTitleRight}
            />
          </View>
        )}
        {headerImage ? (
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Image
              resizeMode='contain'
              source={headerImage}
              style={{...modalStyles.modalHeaderImage, ...imageStyle}}
            />
          </View>
        ) : (
          <Text style={modalStyles.modalTitle}>{headerTitle || getTitle()}</Text>
        )}
      </View>
    </View>
  );
};

export default ModalWrapperHeader;
