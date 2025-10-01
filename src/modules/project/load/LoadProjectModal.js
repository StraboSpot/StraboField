import React from 'react';

import {useDispatch} from 'react-redux';

import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {setIsStatusMessagesModalVisible} from '../../home/home.slice';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import DatasetSummaryList from '../datasets/DatasetSummaryList';

const LoadProjectModal = ({closeModal}) => {
  const dispatch = useDispatch();

  const handleActionButtonPressed = () => {
    dispatch(setIsStatusMessagesModalVisible(false));
    dispatch(setSidePanelVisible({bool: false}));
    closeModal();
  };

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      headerTitle={'Dataset Preferences'}
      isVisible={true}
      onActionPressed={handleActionButtonPressed}
      showCancelButton={false}
    >
      <DatasetSummaryList/>
    </ModalWrapper>
  );
};

export default LoadProjectModal;
