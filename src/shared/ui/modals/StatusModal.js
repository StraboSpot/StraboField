import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';
import {setIsProjectLoadSelectionModalVisible, setIsStatusMessagesModalVisible} from '../../../modules/home/home.slice';
import {MAIN_MENU_ITEMS} from '../../../modules/main-menu-panel/mainMenu.constants';
import DatasetPreferences from '../../../modules/project/datasets/DatasetPreferences';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import OutlineButton from '../buttons/OutlineButton';

const StatusModal = () => {
  const dispatch = useDispatch();
  const isModalLoading = useSelector(state => state.home.loading.modal);
  const isStatusMessagesModalVisible = useSelector(state => state.home.isStatusMessagesModalVisible);
  const statusMessages = useSelector(state => state.home.statusMessages);
  const mainMenuPageVisible = useSelector(state => state.mainMenu.mainMenuPageVisible);

  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);

  const isLoadingProject = mainMenuPageVisible !== MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS;

  const [isShowingDatasetPreferences, setIsShowingDatasetPreferences] = useState(false);

  useEffect(() => {
    if (isProjectLoadSelectionModalVisible) dispatch(setIsProjectLoadSelectionModalVisible(false));
    if (Platform.OS === 'web' && isLoadingProject) setIsShowingDatasetPreferences(true);
    else setIsShowingDatasetPreferences(false);
  }, [isStatusMessagesModalVisible]);

  const closeModal = () => dispatch(setIsStatusMessagesModalVisible(false));

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      closeModal={closeModal}
      headerTitle={isShowingDatasetPreferences ? 'Dataset Preferences' : 'Status'}
      isVisible={isStatusMessagesModalVisible}
      onActionPressed={closeModal}
      onCancelPress={closeModal}
      overlayStyleOverride={isLoadingProject && {height: '80%', width: 450}}
      showActionButton={isShowingDatasetPreferences}
      showCancelButton={!isModalLoading && !isLoadingProject}
      showCloseButton={!isModalLoading || isShowingDatasetPreferences}
    >
      <View style={{flex: 1}}>
        {!isShowingDatasetPreferences && (
          <>
            <LottieAnimations
              doesLoop={isModalLoading}
              show={isModalLoading}
              type={isModalLoading ? 'loadingFile' : 'complete'}
            />
            <Text style={overlayStyles.statusMessageText}>{statusMessages.join('\n')}</Text>
            {!isModalLoading && isLoadingProject && (
              <OutlineButton
                onPress={() => setIsShowingDatasetPreferences(true)}
                title={'Show Datasets'}
              />
            )}
          </>
        )}
        {isShowingDatasetPreferences && isLoadingProject && <DatasetPreferences/>}
      </View>
    </ModalWrapper>
  );
};

export default StatusModal;
