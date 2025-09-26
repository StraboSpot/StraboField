import React, {useState} from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import {Button, Icon, ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useDownload from '../../../services/useDownload';
import commonStyles from '../../../shared/common.styles';
import {MEDIUMGREY, POSITIVE_COLOR, RED, WARNING_COLOR} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui';
import LittleSpacer from '../../../shared/ui/LittleSpacer';
import DeleteConformationDialogBox from '../../../shared/ui/modals/DeleteConformationDialogBox';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import {DateInputField, formStyles, NumberInputField} from '../../form';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import {setReadOnlyDatasetsIds, updatedDatasetProperties} from '../projects.slice';
import useProject from '../useProject';

const DatasetDetail = ({dataset}) => {
  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const readOnlyDatasetsIds = useSelector(state => state.project.readOnlyDatasetsIds) || [];
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {initializeDownloadImages} = useDownload();
  const {destroyDataset} = useProject();
  const toast = useToast();

  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [datasetName, setDatasetName] = useState(dataset.name);

  const isReadOnly = readOnlyDatasetsIds.includes(dataset.id);
  const isTarget = targetDatasetId === dataset.id;

  const backToProjectPanel = () => dispatch(setSidePanelVisible({bool: false}));

  const downloadImages = async () => {
    await initializeDownloadImages(dataset);
    backToProjectPanel();
  };

  const handleBackPressed = () => {
    if (datasetName !== dataset.name) {
      saveDataset();
      toast.show('Changes Saved!', 'success');
    }
    backToProjectPanel();
  };

  const handleDeletePressed = () => setIsDeleteConfirmModalVisible(true);

  const initializeDeleteDataset = () => {
    setIsDeleteConfirmModalVisible(false);
    if (dataset && dataset.id) {
      destroyDataset(dataset.id)
        .then(backToProjectPanel)
        .catch(err => console.log('Error deleting dataset', err));
    }
    else console.error('Target dataset or id is undefined!');
  };

  const isDisabled = (id) => {
    return (activeDatasetsIds.length === 1 && activeDatasetsIds[0] === id) || (targetDatasetId && targetDatasetId === id);
  };

  const onToggleReadOnly = () => dispatch(setReadOnlyDatasetsIds(dataset.id));

  const renderDeleteConfirmationModal = () => {
    return (
      <DeleteConformationDialogBox
        headerTitle={'Confirm Delete!'}
        isVisible={isDeleteConfirmModalVisible}
        onActionPressed={initializeDeleteDataset}
        onCancelPress={() => setIsDeleteConfirmModalVisible(false)}
      >
        <Text style={{textAlign: 'center'}}>Are you sure you want to delete Dataset
          {dataset && dataset.name && <Text>{'\n' + dataset.name}</Text>}?
        </Text>
        <Text style={overlayStyles.statusMessageText}>
          This will
          <Text style={overlayStyles.importantText}> ERASE </Text>
          everything in this dataset including Spots, images, and all other data!
        </Text>
      </DeleteConformationDialogBox>
    );
  };

  // Delete Dataset Button
  const renderDeleteDatasetButton = () => {
    return (
      <View style={{paddingBottom: 10}}>
        <Button
          disabled={isDisabled(dataset.id)}
          icon={
            <Icon
              color={isDisabled(dataset.id) ? MEDIUMGREY : RED}
              iconStyle={{paddingRight: 10}}
              name={'trash'}
              size={20}
              type={'font-awesome'}
            />
          }
          onPress={handleDeletePressed}
          title={'Delete Dataset'}
          titleStyle={overlayStyles.importantText}
          type={'clear'}
        />
        {isDisabled(dataset.id) && (
          <Text style={[overlayStyles.importantText, {paddingHorizontal: 30}]}>
            *{dataset.name} can not be deleted while still set as the target (starred) dataset.
          </Text>
        )}
      </View>
    );
  };

  // Dataset Images Field
  const renderImagesField = () => {
    const imagesCount = dataset?.images?.imageIds?.length || 0;
    const imagesNeededCount = dataset?.images?.neededImagesIds?.length || 0;

    return (
      <>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content
            style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
          >
            <View style={{flex: 1}}>
              <View style={formStyles.fieldLabelContainer}>
                <Text style={formStyles.fieldLabel}>{'Images'}</Text>
              </View>
              <TextInput
                editable={false}
                style={formStyles.fieldValue}
                value={imagesCount.toString()}
              />
            </View>
            {Platform.OS !== 'web' && imagesNeededCount === 0 && (
              <Icon
                color={POSITIVE_COLOR}
                name={'checkmark-outline'}
                size={30}
                type={'ionicon'}
              />
            )}
          </ListItem.Content>
        </ListItem>

        {Platform.OS !== 'web' && (
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content
              style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
            >
              <View style={{flex: 1}}>
                <View style={formStyles.fieldLabelContainer}>
                  <Text style={formStyles.fieldLabel}>{'Images Needed to Download'}</Text>
                </View>
                <TextInput
                  editable={false}
                  style={formStyles.fieldValue}
                  value={imagesNeededCount.toString()}
                />
              </View>
              {imagesNeededCount > 0 && (
                <Icon
                  color={WARNING_COLOR}
                  name={'download-circle-outline'}
                  onPress={downloadImages}
                  size={30}
                  type={'material-community'}
                />
              )}
            </ListItem.Content>
          </ListItem>
        )}
      </>
    );
  };

  // Dataset ID & Timestamps
  const renderMetadataForm = () => {
    return (
      <Formik initialValues={dataset}>
        {() => (
          <>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={NumberInputField}
                  editable={false}
                  key={'id'}
                  label={'ID'}
                  name={'id'}
                />
              </ListItem.Content>
            </ListItem>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={DateInputField}
                  isDisplayOnly={true}
                  isShowTime={true}
                  key={'date'}
                  label={'Date Created'}
                  name={'date'}
                />
              </ListItem.Content>
            </ListItem>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={DateInputField}
                  isDisplayOnly={true}
                  isShowTime={true}
                  key={'modified_timestamp'}
                  label={'Date Last Modified'}
                  name={'modified_timestamp'}
                />
              </ListItem.Content>
            </ListItem>
          </>
        )}
      </Formik>
    );
  };

  // Dataset Name Field
  const renderNameField = () => {
    return (
      <View style={{alignContent: 'flex-start'}}>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content
            style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
          >
            <View style={{flex: 1}}>
              <View style={formStyles.fieldLabelContainer}>
                <Text style={formStyles.fieldLabel}>{'Name'}</Text>
              </View>
              <TextInput
                editable={!isReadOnly}
                onChangeText={text => setDatasetName(text)}
                style={formStyles.fieldValue}
                value={datasetName}
              />
            </View>
          </ListItem.Content>
        </ListItem>
      </View>
    );
  };

  const renderReadOnlyDatasetButton = () => {
    return (
      <View style={{alignContent: 'flex-start'}}>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content
            style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
          >
            <View style={{flex: 1}}>
              <View style={formStyles.fieldLabelContainer}>
                <Text style={formStyles.fieldLabel}>{'Read Only'}</Text>
              </View>
            </View>
          </ListItem.Content>
          <SwitchWrapper disabled={isTarget} onValueChange={onToggleReadOnly} value={isReadOnly}/>
        </ListItem>
      </View>
    );
  };

  // Dataset Spots Field
  const renderSpotsField = () => {
    const spotsCount = dataset.spotIds?.length || 0;

    return (
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <View style={formStyles.fieldLabelContainer}>
            <Text style={formStyles.fieldLabel}>{'Spots'}</Text>
          </View>
          <TextInput
            editable={false}
            style={formStyles.fieldValue}
            value={spotsCount.toString()}
          />
        </ListItem.Content>
      </ListItem>
    );
  };

  const saveDataset = () => {
    let datasetCopy = JSON.parse(JSON.stringify(dataset));
    datasetCopy = {...datasetCopy, name: datasetName};
    dispatch(updatedDatasetProperties(datasetCopy));
    backToProjectPanel();
  };

  return (
    <>
      <SidePanelHeader
        backButton={handleBackPressed}
        headerTitle={'Dataset Detail'}
        title={datasetName === dataset.name ? 'Datasets' : 'Datasets (Save Changes)'}
      />

      {renderNameField()}
      {renderMetadataForm()}
      {renderSpotsField()}
      {renderImagesField()}
      <LittleSpacer/>
      {renderReadOnlyDatasetButton()}
      <LittleSpacer/>
      {Platform.OS === 'web' && renderDeleteDatasetButton()}

      {/* Child Modal */}
      {isDeleteConfirmModalVisible && renderDeleteConfirmationModal()}
    </>
  );
};

export default DatasetDetail;
