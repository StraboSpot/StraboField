import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import modalStyle from './modal.style';
import {setModalVisible} from '../../../modules/home/home.slice';
import {MODALS} from '../../../modules/page/page.constants';
import * as themes from '../../styles.constants';

const OverlayWrapperHeader = ({
                       buttonTitleLeft,
                       buttonTitleRight,
                       cancel,
                       closeModal,
                       title,
                     }) => {
  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const modalVisible = useSelector(state => state.home.modalVisible);

  const modalInfo = MODALS.find(p => p.key === modalVisible);

  const getTitle = () => modalInfo && (modalInfo.action_label || modalInfo.label);

  return (
    <View style={modalStyle.modalTop}>
      <View style={modalStyle.modalHeaderContainer}>
        {!isProjectLoadSelectionModalVisible && (
          <View style={modalStyle.modalHeaderButtonsContainer}>
            <Button
              titleStyle={{color: themes.PRIMARY_ACCENT_COLOR, fontSize: 16}}
              title={buttonTitleLeft}
              type={'clear'}
              onPress={cancel}
              buttonStyle={{padding: 0}}
            />
            <Button
              titleStyle={{color: themes.PRIMARY_ACCENT_COLOR, fontSize: 16}}
              title={buttonTitleRight === '' ? '' : buttonTitleRight || 'Close'}
              type={'clear'}
              onPress={closeModal || (() => dispatch(setModalVisible({modal: null})))}
            />
          </View>
        )}
        <Text style={modalStyle.modalTitle}>{title || getTitle()}</Text>
      </View>
    </View>
  );
};

export default OverlayWrapperHeader;
