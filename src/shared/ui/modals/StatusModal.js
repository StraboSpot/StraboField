import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';
import {setIsProjectLoadSelectionModalVisible, setIsStatusMessagesModalVisible} from '../../../modules/home/home.slice';
import {MAIN_MENU_ITEMS} from '../../../modules/main-menu-panel/mainMenu.constants';
import DatasetPreferences from '../../../modules/project/datasets/DatasetPreferences';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import {isEmpty} from '../../helpers';
import OutlineButton from '../buttons/OutlineButton';

const StatusModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentProjectId = useSelector(state => state.project.project?.id);
  const isModalLoading = useSelector(state => state.home.loading.modal);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const isStatusMessagesModalVisible = useSelector(state => state.home.isStatusMessagesModalVisible);
  const mainMenuPageVisible = useSelector(state => state.mainMenu.mainMenuPageVisible);
  const statusMessages = useSelector(state => state.home.statusMessages);

  /* Local State */

  const [isShowingDatasetPreferences, setIsShowingDatasetPreferences] = useState(false);

  /* Derived Variables */

  // Match the actual failure headlines the flows emit ('Error ...', 'Download/Upload Failed!') without tripping on
  // benign progress lines like 'Failed Images: 0/5'.
  const isError = statusMessages.some(msg => /^(Error|Failed)|Failed!/i.test(msg));
  const isLoadingProject = mainMenuPageVisible !== MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS;

  /* Side Effects */

  useEffect(() => {
    if (isProjectLoadSelectionModalVisible && !isEmpty(currentProjectId)) {
      dispatch(setIsProjectLoadSelectionModalVisible(false));
    }
    if (Platform.OS === 'web' && isLoadingProject) setIsShowingDatasetPreferences(true);
    else setIsShowingDatasetPreferences(false);
  }, [isStatusMessagesModalVisible, isLoadingProject, dispatch, isProjectLoadSelectionModalVisible]);

  /* Logic Helpers */

  const closeModal = () => {
    // Reset dataset preferences view before closing
    setIsShowingDatasetPreferences(false);

    // Close the modal first
    dispatch(setIsStatusMessagesModalVisible(false));
  };

  const getOverlayStyle = () => {
    // When showing dataset preferences, make modal larger
    if (isShowingDatasetPreferences) {
      return {
        maxHeight: '60%',
        width: Platform.OS === 'web' ? 600 : '60%',
      };
    }
    // When loading or showing status messages, use smaller width
    return {
      height: 'auto',
      width: Platform.OS === 'web' ? 400 : '40%',
    };
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      closeModal={closeModal}
      headerTitle={isShowingDatasetPreferences ? 'Dataset Preferences' : 'Status'}
      isLoading={isModalLoading && !isShowingDatasetPreferences}
      isVisible={isStatusMessagesModalVisible}
      onActionPressed={closeModal}
      onCancelPress={closeModal}
      overlayStyleOverride={getOverlayStyle()}
      showActionButton={isShowingDatasetPreferences}
      showCancelButton={false}
      showCloseButton={!isModalLoading || isShowingDatasetPreferences}
    >
      {!isShowingDatasetPreferences && (
        <View>
          <LottieAnimations
            doesLoop={isModalLoading}
            type={isModalLoading ? 'loadingFile' : isError ? 'error' : 'complete'}
          />
          <Text style={overlayStyles.statusMessageText}>{statusMessages.join('\n')}</Text>
        </View>
      )}
      {!isModalLoading && !isError && isLoadingProject && !isShowingDatasetPreferences && (
        <OutlineButton onPress={() => setIsShowingDatasetPreferences(true)} title={'Show Datasets'}/>
      )}
      {isShowingDatasetPreferences && isLoadingProject && <DatasetPreferences/>}
    </ModalWrapper>
  );
};

export default StatusModal;
