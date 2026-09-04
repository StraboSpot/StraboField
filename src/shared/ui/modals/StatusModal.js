import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import ProgressBar from 'react-native-progress/Bar';
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
  const mapImportProgress = useSelector(state => state.home.mapImportProgress);
  const statusMessages = useSelector(state => state.home.statusMessages);

  /* Local State */

  const [isDatasetPreferencesSelected, setIsDatasetPreferencesSelected] = useState(false);

  /* Derived Variables */

  // Match the actual failure headlines the flows emit ('Error ...', 'Download/Upload Failed!') without tripping on
  // benign progress lines like 'Failed Images: 0/5'.
  const isError = statusMessages.some(msg => /^(Error|Failed)|Failed!/i.test(msg));
  const isLoadingProject = mainMenuPageVisible !== MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS;
  // Web is entered with the project already chosen, so the download's status lines are never the point there — the
  // dataset preferences are. Deriving this instead of storing it keeps the status view out of a web project load
  // entirely, including the frame it used to flash while the modal animated closed.
  const isShowingDatasetPreferences = isDatasetPreferencesSelected || (Platform.OS === 'web' && isLoadingProject);
  // A non-empty label means an offline-map import phase (unzipping or moving tiles) is running, so show the bar.
  const isImportingMaps = isModalLoading && !isEmpty(mapImportProgress?.label);

  /* Side Effects */

  useEffect(() => {
    if (isProjectLoadSelectionModalVisible && !isEmpty(currentProjectId)) {
      dispatch(setIsProjectLoadSelectionModalVisible(false));
    }
    setIsDatasetPreferencesSelected(false);
  }, [isStatusMessagesModalVisible, isLoadingProject, dispatch, isProjectLoadSelectionModalVisible]);

  /* Logic Helpers */

  const closeModal = () => {
    // Reset dataset preferences view before closing
    setIsDatasetPreferencesSelected(false);

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
          {isImportingMaps && (
            <View style={overlayStyles.overlayContent}>
              <ProgressBar progress={mapImportProgress.progress} width={200}/>
              <Text style={overlayStyles.statusMessageText}>
                {mapImportProgress.label} — {Math.round(mapImportProgress.progress * 100)}%
              </Text>
            </View>
          )}
          <Text style={overlayStyles.statusMessageText}>{statusMessages.join('\n')}</Text>
        </View>
      )}
      {!isModalLoading && !isError && isLoadingProject && !isShowingDatasetPreferences && (
        <OutlineButton onPress={() => setIsDatasetPreferencesSelected(true)} title={'Show Datasets'}/>
      )}
      {isShowingDatasetPreferences && isLoadingProject && <DatasetPreferences/>}
    </ModalWrapper>
  );
};

export default StatusModal;
