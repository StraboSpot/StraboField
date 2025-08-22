import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import ProgressBar from 'react-native-progress/Bar';
import {useDispatch, useSelector} from 'react-redux';

import useDownload from '../../../services/useDownload';
import useImport from '../../../services/useImport';
import {isEmpty} from '../../../shared/Helpers';
import ProgressModal from '../../../shared/ui/modal/ProgressModal';
import LottieAnimation from '../../../utils/animations/LottieAnimations';
import {setIsProgressModalVisible} from '../../home/home.slice';
import {setSelectedProject} from '../projects.slice';

const UploadProgressModal = ({isProgressModalVisible}) => {

  const dispatch = useDispatch();
  const isImageTransferring = useSelector(state => state.project.isImageTransferring);
  const projectTransferProgress = useSelector(state => state.connections.projectTransferProgress);
  const selectedProject = useSelector(state => state.project.selectedProject);
  const statusMessages = useSelector(state => state.home.statusMessages);

  const [datasetsNotUploaded, setDatasetsNotUploaded] = useState([]);
  const [error, setError] = useState(false);
  const [uploadComplete, setUploadComplete] = useState('');

  const {initializeDownload} = useDownload();
  const {loadProjectFromDevice} = useImport();

  const handleCompletePress = async () => {
    try {
      const project = selectedProject.project;
      dispatch(setSelectedProject({project: '', source: ''}));
      dispatch(setIsProgressModalVisible(false));
      if (selectedProject.source === 'server' && !isEmpty(project)) {
        console.log('Downloading Project');
        await initializeDownload(project);
        console.log('Download Complete!');

      }
      else if (selectedProject.source === 'device' && !isEmpty(project)) {
        console.log(`Loading ${project.fileName} project from device.`);
        await loadProjectFromDevice(project, false);
        console.log(`${project.fileName} has been imported.`);
      }
      setUploadComplete('');
      setDatasetsNotUploaded([]);
      setError(false);
    }
    catch (err) {
      console.error('Error loading or downloading project', err);
      setUploadComplete('');
      setError(true);
    }
  };

  const renderDatasetsNotUploadedList = (dataset) => {
    return (
      <Text style={{textAlign: 'left'}}>{dataset.name}</Text>
    );
  };

  const renderDatasetsNotUploaded = () => {
    return (
      <View>
        <View style={{alignItems: 'center'}}>
          <Icon
            name={'warning-outline'}
            type={'ionicon'}
            color={'orange'}
            containerStyle={{paddingTop: 15}}
          />
          <Text style={{marginBottom: 15, textAlign: 'left'}}>The following datasets did not upload because the version
            on the server is the same or newer:</Text>
          <FlatList
            data={datasetsNotUploaded}
            renderItem={({item}) => renderDatasetsNotUploadedList(item)}
            ListEmptyComponent={<Text>All datasets were uploaded.</Text>}
          />
        </View>
      </View>
    );
  };

  return (
    <ProgressModal
      buttonText={selectedProject.source !== '' && 'Continue'}
      closeProgressModal={() => dispatch(setIsProgressModalVisible(false))}
      dialogTitle={'UPLOADING...'}
      isProgressModalVisible={isProgressModalVisible}
      onPressComplete={() => handleCompletePress()}
      showButton={uploadComplete === 'complete' || error}
      showInfo={!isEmpty(datasetsNotUploaded)}
      animation={
        <LottieAnimation
          type={error ? 'error' : uploadComplete === 'complete' ? 'complete' : 'uploading'}
          doesLoop={uploadComplete === 'uploading'}
          show={uploadComplete === 'uploading'}
          error={error}
        />}
      info={renderDatasetsNotUploaded()}
    >
      {!error ? (
          <View>
            <View style={{padding: 10}}>
              <Text style={{textAlign: 'center'}}>{statusMessages}</Text>
            </View>
            {isImageTransferring && <View style={{paddingTop: 10}}>
              <Text style={{textAlign: 'center', paddingBottom: 5}}>Uploading images</Text>
              <ProgressBar
                progress={projectTransferProgress}
                width={250}
                height={15}
                borderRadius={20}
              />
              <Text style={{textAlign: 'center'}}>{`${(projectTransferProgress * 100).toFixed(0)}%`}</Text>
            </View>}
            {/*{uploadComplete && datasetsNotUploaded?.length > 0 && renderDatasetsNotUploaded()}*/}
          </View>
        )
        : <View>
          <Text style={{textAlign: 'center'}}>{statusMessages}</Text>
        </View>
      }
    </ProgressModal>
  );
};

export default UploadProgressModal;
