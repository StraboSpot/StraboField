import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import modalStyles from './modal.styles';
import {setModalVisible} from '../../../modules/home/home.slice';
import {MODALS} from '../../../modules/page/page.constants';
import * as themes from '../../styles.constants';

const ModalWrapperHeader = ({
                              buttonTitleLeft,
                              buttonTitleRight,
                              cancel,
                              closeModal,
                              showCloseButton = false,
                              headerTitle,
                            }) => {
  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const modalVisible = useSelector(state => state.home.modalVisible);

  const modalInfo = MODALS.find(p => p.key === modalVisible);

  const getTitle = () => modalInfo && (modalInfo.action_label || modalInfo.label);

  return (
    <View style={modalStyles.modalTop}>
      <View style={modalStyles.modalHeaderContainer}>
        {!isProjectLoadSelectionModalVisible && (
          <View style={modalStyles.modalHeaderButtonsContainer}>
            <Button
              buttonStyle={{padding: 0}}
              onPress={cancel}
              title={buttonTitleLeft}
              titleStyle={{color: themes.PRIMARY_ACCENT_COLOR, fontSize: 16}}
              type={'clear'}
            />
            {showCloseButton && (
              <Button
                onPress={closeModal || (() => dispatch(setModalVisible({modal: null})))}
                title={buttonTitleRight === '' ? '' : buttonTitleRight || 'X'}
                titleStyle={{color: themes.PRIMARY_ACCENT_COLOR, fontSize: 18}}
                type={'clear'}
              />
            )}
          </View>
        )}
        <Text style={modalStyles.modalTitle}>{headerTitle || getTitle()}</Text>
      </View>
    </View>
  );
};

export default ModalWrapperHeader;
