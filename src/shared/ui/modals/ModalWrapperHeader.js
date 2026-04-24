import React from 'react';
import {Text, View} from 'react-native';

import {Image} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import modalStyles from './modal.styles';
import {setModalVisible} from '../../../modules/home/home.slice';
import {MODALS} from '../../../modules/page/page.constants';
import CloseButton from '../buttons/CloseButton';

const ModalWrapperHeader = ({
                              buttonTitleRight,
                              closeModal,
                              showCloseButton = false,
                              headerTitle,
                              headerImage,
                            }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const modalVisible = useSelector(state => state.home.modalVisible);

  /* Derived Variables */

  const modalInfo = MODALS.find(p => p.key === modalVisible);

  /* Logic Helpers */

  const getTitle = () => modalInfo && (modalInfo.action_label || modalInfo.label);

  /* View */

  return (
    <View style={modalStyles.modalTop}>
      <View style={modalStyles.modalHeaderContainer}>
        {showCloseButton && (
          <View style={modalStyles.modalHeaderButtonsContainer}>
            <CloseButton
              onPress={closeModal || (() => dispatch(setModalVisible({modal: null})))}
              title={buttonTitleRight}
            />
          </View>
        )}
        {headerImage ? (
          <Image
            resizeMode='contain'
            source={headerImage}
            style={modalStyles.modalHeaderImage}
          />
        ) : (
          <Text style={modalStyles.modalTitle}>{headerTitle || getTitle()}</Text>
        )}
      </View>
    </View>
  );
};

export default ModalWrapperHeader;
