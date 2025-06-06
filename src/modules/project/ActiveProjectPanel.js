import React, {useEffect, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import ActiveProjectList from './ActiveProjectList';
import CustomFeatureTypes from './CustomFeatureTypes';
import DatasetList from './dataset/DatasetList';
import ProjectPrivacy from './ProjectPrivacy';
import {setActiveDatasets, setSelectedDataset} from './projects.slice';
import useProject from './useProject';
import useDownload from '../../services/useDownload';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import TextInputModal from '../../shared/ui/TextInputModal';
import {clearedStatusMessages} from '../home/home.slice';
import {WarningModal} from '../home/modals';
import DailyNotesSection from './description/DailyNotesSection';

const ActiveProjectPanel = ({setDatasetToView}) => {
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

        {/*Project Datasets*/}
        <View style={{maxHeight: 400}}>
          <SectionDividerWithRightButton
            dividerText={'Datasets'}
            onPress={() => setIsAddDatasetModalVisible(true)}
          />
          <DatasetList setDatasetToView={setDatasetToView}/>
          <View style={{justifyContent: 'flex-start', alignItems: 'center', padding: 10}}>
            <Text style={commonStyles.standardDescriptionText}>*New Spots will be added to the starred dataset.</Text>
          </View>
        </View>

        <View style={{flex: 1}}>
          <FlatList
            ListHeaderComponent={
              <>
                <ProjectPrivacy/>
                <DailyNotesSection/>
                <CustomFeatureTypes/>
              </>
            }
          />
        </View>

        {/*Footer*/}
        {Platform.OS !== 'web' && (
          <View style={{padding: 10}}>
            {user.name && (
              <View>
                <Button
                  title={'Download Server Version of Project'}
                  titleStyle={commonStyles.standardButtonText}
                  type={'outline'}
                  onPress={() => handleDownloadProject()}
                />
                <View style={{alignItems: 'center', paddingVertical: 10}}>
                  <Text style={commonStyles.standardDescriptionText}>
                    *This will overwrite anything that has not been uploaded to the server
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

      </View>

      {/* Modals */}
      {renderAddDatasetModal()}
      {renderWarningModal()}
    </>
  );
};

export default ActiveProjectPanel;
