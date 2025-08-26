import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import DatasetList from './DatasetList';
import useDownload from '../../../services/useDownload';
import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/Helpers';
import SectionDividerWithRightButton from '../../../shared/ui/SectionDividerWithRightButton';
import TextInputModal from '../../../shared/ui/TextInputModal';
import {WarningModal} from '../../home/modals';
import {setActiveDatasets, setTargetDataset} from '../projects.slice';
import useProject from '../useProject';

const DatasetsPage = ({setDatasetToView}) => {
  const {initializeDownload} = useDownload();
  const {addDataset} = useProject();

  const [datasetName, setDatasetName] = useState(null);
  const [isAddDatasetModalVisible, setIsAddDatasetModalVisible] = useState(false);
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const datasets = useSelector(state => state.project.datasets);
  const project = useSelector(state => state.project.project);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  useEffect(() => {
    console.log('UE DatasetsPage [datasets]', datasets);
    if (Object.values(datasets).length > 0 && !isEmpty(Object.values(datasets)[0])) {
      if (activeDatasetsIds.length === 0) {
        dispatch(setActiveDatasets({bool: true, dataset: Object.values(datasets)[0].id}));
        dispatch(setTargetDataset(Object.values(datasets)[0].id));
      }
      else if (!targetDatasetId) dispatch(setTargetDataset(activeDatasetsIds[0]));
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

  const renderAddDatasetModal = () => {
    return (
      <TextInputModal
        visible={isAddDatasetModalVisible}
        dialogTitle={'Add a Dataset'}
        onPress={onAddDataset}
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
      <View style={{flex: 1, flexDirection: 'column'}}>
        <SectionDividerWithRightButton
          dividerText={'Datasets'}
          onPress={() => setIsAddDatasetModalVisible(true)}
        />
        <DatasetList setDatasetToView={setDatasetToView}/>
        <View style={{justifyContent: 'flex-start', alignItems: 'center', padding: 10}}>
          <Text style={commonStyles.standardDescriptionText}>*Starred dataset will be set as the target dataset for new Spots.</Text>
        </View>
      </View>

      {/* Modals */}
      {renderAddDatasetModal()}
      {renderWarningModal()}
    </>
  );
};

export default DatasetsPage;
