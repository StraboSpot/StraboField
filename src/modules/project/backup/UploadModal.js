import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import KeepAwake from 'react-native-keep-awake';
import ProgressBar from 'react-native-progress/Bar';
import {useDispatch, useSelector} from 'react-redux';

import uploadModalStyles from './uploadModal.styles';
import {updatedProjectTransferProgress} from '../../../services/connections.slice';
import useUpload from '../../../services/useUpload';
import useUploadImages from '../../../services/useUploadImages';
import {isEmpty} from '../../../shared/Helpers';
import {LARGE_TEXT_SIZE} from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import Spacer from '../../../shared/ui/Spacer';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import {clearedStatusMessages, setIsProgressModalVisible} from '../../home/home.slice';
import {setIsImageTransferring} from '../projects.slice';

const UploadModal = ({closeModal, isVisible}) => {
  const dispatch = useDispatch();
  const currentProject = useSelector(state => state.project.project);
  const endpoint = useSelector(state => state.connections.databaseEndpoint);
  const isImageTransferring = useSelector(state => state.project.isImageTransferring);
  const projectTransferProgress = useSelector(state => state.connections.projectTransferProgress);

  const [datasetUploadSuccess, setDatasetUploadStatus] = useState(false);
  const [errorMessage, setErrorMesssage] = useState('');
  const [imageUploadStatus, setImageUploadStatus] = useState({});
  const [modalTitle, setModalTitle] = useState('Upload Project');
  const [projectUploadSuccess, setProjectUploadStatus] = useState(false);
  const [uploadState, setUploadState] = useState('not started');
  const [uploadImageSuccess, setUploadImageSuccess] = useState(false);

  const {uploadProject, uploadDatasets, uploadStatusMessage} = useUpload();
  const {
    currentImage,
    currentImageStatus,
    imageUploadStatusMessage,
    totalImages,
    initializeImageUpload,
    resetState,
  } = useUploadImages();

  useEffect(() => {
    console.log('uploadState', uploadState);
    console.log('Current Image', currentImage);
    console.log('Is Image Transferring', isImageTransferring);
  }, [uploadState, currentImage]);

  const handleActionPressed = async () => {
    if (uploadState === 'not started') await initiateUpload();
    else if (uploadState === 'complete' || uploadState === 'error') handleClosePress();
  };

  const handleClosePress = () => {
    setModalTitle('Upload Project');
    setUploadState('not started');
    setProjectUploadStatus(false);
    setDatasetUploadStatus(false);
    setUploadImageSuccess(false);
    resetState();
    closeModal();
  };

  const initiateUpload = async () => {
    try {
      dispatch(clearedStatusMessages());
      isImageTransferring && dispatch(setIsImageTransferring(false));
      dispatch(updatedProjectTransferProgress(0));
      Platform.OS !== 'web' && KeepAwake.activate();
      setModalTitle('Uploading');
      setUploadState('uploading');
      setProjectUploadStatus(await uploadProject());
      setDatasetUploadStatus(await uploadDatasets());
      const imageStatus = await initializeImageUpload();
      setUploadImageSuccess(true);
      dispatch(setIsProgressModalVisible(false));
      dispatch(setIsImageTransferring(false));
      setImageUploadStatus(imageStatus);
      if (imageStatus.imagesNotFound) {
        setUploadState('error');
        setModalTitle('Uploaded With Errors!');
        setErrorMesssage(`There are ${imageStatus.imagesNotFound} images needed that were not found on this device.`);
      }
      else {
        setUploadState('complete');
        setModalTitle('All Uploaded!');
      }
    }
    catch (err) {
      console.error('Error uploading', err);
      setErrorMesssage(err.toString());
      setUploadState('error');
    }
  };

  const renderErrorView = () => {
    return (
      <View style={{padding: 10}}>
        <LottieAnimations
          doesLoop={false}
          show={uploadState === 'error'}
          type={'error'}
        />
        <Text style={{textAlign: 'center'}}>{errorMessage}</Text>
      </View>
    );
  };

  const renderImageUploadingProgress = () => {
    return (
      <View>
        <View style={{padding: 10}}>
          {currentImage !== '' && <Text style={{fontWeight: 'bold'}}>Uploading image {currentImage}</Text>}
          <Text style={{textAlign: 'center', margin: 5}}>Success: {currentImageStatus.success} / {totalImages}</Text>
          <Text style={{textAlign: 'center'}}>Failed {currentImageStatus.failed} / {totalImages}</Text>
        </View>
        <Text style={{textAlign: 'center', paddingBottom: 5}}>Uploading images</Text>
        <ProgressBar
          borderRadius={20}
          height={15}
          progress={projectTransferProgress}
          width={250}
        />
        <Text style={{textAlign: 'center'}}>{`${(projectTransferProgress * 100).toFixed(0)}%`}</Text>
      </View>
    );
  };

  const renderImageUploadStatusText = () => {
    if (uploadState === 'complete') {
      return (
        <View style={uploadModalStyles.imageTotalUploadContainer}>
          <Text>Images uploaded successfully: {imageUploadStatus.success || 0}</Text>
        </View>
      );
    }
    else if (uploadState === 'error') {
      return (
        <View style={uploadModalStyles.imageTotalUploadContainer}>
          <Text>Images uploaded successfully: {imageUploadStatus.success || 0}</Text>
          <Text>Images Failed: {imageUploadStatus.failed || 0}</Text>
        </View>
      );
    }
  };

  const renderInitialUploadView = () => (
    <View>
      <Text style={[overlayStyles.contentText, {paddingTop: 20, fontSize: LARGE_TEXT_SIZE}]}>
        {!isEmpty(currentProject) && currentProject.description?.project_name}
      </Text>
      {endpoint.isSelected ? <Text style={overlayStyles.importantText}>Uploading to: {endpoint.endpoint}</Text>
        : <Text style={overlayStyles.contentText}>Uploading to: StraboSpot Server</Text>}
      <Spacer/>
      <Text style={[overlayStyles.contentText, {textAlign: 'left', padding: 10}]}>
        - Geologic units, tags, reports and templates will be merged into the project already on the server.{'\n'}
        - Newer datasets will <Text style={overlayStyles.importantText}>OVERWRITE</Text> older datasets already on the
        server.{'\n'}
        - Read Only datasets will not be affected unless they were removed from Read Only status and modified.
      </Text>
      {__DEV__ && <ClearButton onPress={uploadImagesOnly} title={'Upload Images Only (Dev Mode)'}/>}
    </View>
  );

  const renderUploadAnimation = () => {
    return (
      <LottieAnimations
        animationStyle={{height: 50, width: 50}}
        doesLoop={true}
        type={'uploadingCloud'}
      />
    );
  };

  const renderUploadCompleteAnimation = () => {
    return (
      <LottieAnimations
        animationStyle={{height: 50, width: 50}}
        doesLoop={false}
        type={'complete'}
      />
    );
  };

  const renderUploadProgress = () => {
    return (
      <View>
        <View style={uploadModalStyles.messageContainer}>
          <Text style={uploadModalStyles.messageText}>{imageUploadStatusMessage || uploadStatusMessage}</Text>
        </View>
        <View style={[uploadModalStyles.statusContainer]}>
          <View style={uploadModalStyles.gridItem}>
            <View style={{flex: 1}}>
              <Text>Project: </Text>
            </View>
            {projectUploadSuccess ? renderUploadCompleteAnimation() : renderUploadAnimation()}
          </View>
          <View style={uploadModalStyles.gridItem}>
            <View style={{flex: 1}}>
              <Text>Datasets: </Text>
            </View>
            {projectUploadSuccess ? datasetUploadSuccess ? renderUploadCompleteAnimation() : renderUploadAnimation() : null}
          </View>
          <View style={uploadModalStyles.gridItem}>
            <View style={{flex: 1}}>
              <Text>Images:</Text>
            </View>
            {datasetUploadSuccess ? uploadImageSuccess ? renderUploadCompleteAnimation() : renderUploadAnimation() : null}
          </View>
          {isImageTransferring ? renderImageUploadingProgress() : renderImageUploadStatusText()}
        </View>
      </View>
    );
  };

  const uploadImagesOnly = async () => {
    try {
      dispatch(clearedStatusMessages());
      Platform.OS !== 'web' && KeepAwake.activate();
      setModalTitle('Uploading');
      setUploadState('uploading');
      const imageStatus = await initializeImageUpload();
      setImageUploadStatus(imageStatus);
      if (imageStatus.imagesNotFound) {
        setUploadState('error');
        setModalTitle('Uploaded With Errors!');
        setErrorMesssage(
          `There are ${imageStatus.imagesNotFound} images needed that were not found on this device.`);
      }
      else {
        setUploadState('complete');
        setModalTitle('All Uploaded!');
      }
    }
    catch (err) {
      console.error('Error uploading', err);
      alert('Upload Failed!', err.toString());
      closeModal();
    }
  };

  return (
    <ModalWrapper
      actionTitle={uploadState === 'complete' || uploadState === 'error' ? 'OK' : 'Upload'}
      closeModal={closeModal}
      headerTitle={modalTitle}
      isVisible={isVisible}
      onActionPressed={handleActionPressed}
      onCancelPress={handleClosePress}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton={uploadState === 'not started' || uploadState === 'error' || uploadState === 'complete'}
      showCancelButton={uploadState === 'not started'}
    >
      {uploadState === 'not started'
        ? renderInitialUploadView()
        : uploadState !== 'error'
          ? renderUploadProgress()
          : renderErrorView()}
    </ModalWrapper>
  );
};

export default UploadModal;
