import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {Button} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';

import ActiveDatasetsList from './ActiveDatasetsList';
import ActiveProjectList from './ActiveProjectList';
import CustomFeatureTypes from './CustomFeatureTypes';
import DatasetList from './DatasetList';
import {setActiveDatasets, setSelectedDataset} from './projects.slice';
import useProject from './useProject';
import useDownload from '../../services/useDownload';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import TextInputModal from '../../shared/ui/TextInputModal';
import {clearedStatusMessages} from '../home/home.slice';
import {WarningModal} from '../home/modals';

const ActiveProjectPanel = () => {
  const {initializeDownload} = useDownload();
  const {addDataset} = useProject();

  const [datasetName, setDatasetName] = useState(null);
  const [isAddDatasetModalVisible, setIsAddDatasetModalVisible] = useState(false);
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const datasets = useSelector(state => state.project.datasets);
  const project = useSelector(state => state.project.project);
  const selectedDatasetId = useSelector(state => state.project.selectedDatasetId);
  const user = useSelector(state => state.user);

  useEffect(() => {
    console.log('UE ActiveProjectPanel [datasets]', datasets);
    if (Object.values(datasets).length > 0 && !isEmpty(Object.values(datasets)[0])) {
      if (activeDatasetsIds.length === 0) {
        dispatch(setActiveDatasets({bool: true, dataset: Object.values(datasets)[0].id}));
        dispatch(setSelectedDataset(Object.values(datasets)[0].id));
      }
      else if (!selectedDatasetId) dispatch(setSelectedDataset(activeDatasetsIds[0]));
    }
  }, [datasets]);

  const onAddDataset = async () => {
    const addedDataset = await addDataset(datasetName);
    console.log(addedDataset);
    setIsAddDatasetModalVisible(false);
  };

  const confirm = async () => {
    setIsWarningModalVisible(false);
    await initializeDownload(project);
  };

  const handleDownloadProject = () => {
    dispatch(clearedStatusMessages());
    setIsWarningModalVisible(true);
  };

  const renderAddDatasetModal = () => {
    return (
      <TextInputModal
        visible={isAddDatasetModalVisible}
        dialogTitle={'Add a Dataset'}
        onPress={() => onAddDataset()}
        closeModal={() => setIsAddDatasetModalVisible(false)}
        value={datasetName}
        onChangeText={text => setDatasetName(text)}
      />
    );
  };

  const renderWarningModal = () => {
    return (
      <WarningModal
        closeModal={() => setIsWarningModalVisible(false)}
        isVisible={isWarningModalVisible}
        onConfirmPress={confirm}
        showCancelButton={true}
        showConfirmButton={true}
        title={'Overwrite Warning!'}
      >
        <Text>This will OVERWRITE anything that has not been uploaded to the server</Text>
      </WarningModal>
    );
  };

  return (
    <>
      <View style={{flex: 1, flexDirection: 'column', justifyContent: 'space-between'}}>
        {/*Active Projects*/}
        <ActiveProjectList/>

        <View style={{flex: 1}}>
          {/*Project Datasets*/}
          <View style={{flex: 1, flexGrow: 1, overflow: 'hidden'}}>
            <SectionDividerWithRightButton
              dividerText={'Project Datasets'}
              onPress={() => setIsAddDatasetModalVisible(true)}
            />
            <DatasetList/>
          </View>
          {/*Active Datasets*/}
          <View style={{flex: 1, flexGrow: 1, overflow: 'hidden'}}>
            <SectionDivider dividerText={'Active Datasets*'}/>
            <ActiveDatasetsList/>
          </View>
          <View style={{alignItems: 'center', paddingBottom: 10}}>
            <Text style={commonStyles.standardDescriptionText}>*New Spots will be added to the checked dataset.</Text>
          </View>
          <View style={{flex: 1, flexGrow: 1, overflow: 'hidden'}}>
            <SectionDivider dividerText={'Custom Feature Types'}/>
            <CustomFeatureTypes/>
          </View>
        </View>

        {/*Footer*/}
        {Platform.OS !== 'web' && (
          <View style={{padding: 10}}>
            {user.name && (
              <View>
                <Button
                  title={'Download server version of project'}
                  titleStyle={commonStyles.standardButtonText}
                  type={'outline'}
                  onPress={() => handleDownloadProject()}
                />
                <View style={{alignItems: 'center', paddingTop: 20}}>
                  <Text style={commonStyles.standardDescriptionText}>
                    This will overwrite anything that has not been uploaded to the server
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

      </View>
      {renderAddDatasetModal()}
      {renderWarningModal()}
    </>
  );
};

export default ActiveProjectPanel;
