import React, {useState} from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import {Button, Icon, ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useDownload from '../../../services/useDownload';
import commonStyles from '../../../shared/common.styles';
import {MEDIUMGREY, POSITIVE_COLOR, RED, WARNING_COLOR} from '../../../shared/styles.constants';
import DeleteConformationDialogBox from '../../../shared/ui/DeleteConformationDialogBox';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import LittleSpacer from '../../../shared/ui/LittleSpacer';
import {DateInputField, formStyles, NumberInputField} from '../../form';
import overlayStyles from '../../home/overlays/overlay.styles';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import {updatedDatasetProperties} from '../projects.slice';
import useProject from '../useProject';

const DatasetDetail = ({dataset}) => {
  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const selectedDatasetId = useSelector(state => state.project.selectedDatasetId);

  const {initializeDownloadImages} = useDownload();
  const {destroyDataset} = useProject();
  const toast = useToast();

  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [datasetName, setDatasetName] = useState(dataset.name);

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
    else console.error('Selected dataset or id is undefined!');
  };

  const isDisabled = (id) => {
    return (activeDatasetsIds.length === 1 && activeDatasetsIds[0] === id)
      || (selectedDatasetId && selectedDatasetId === id);
  };

  const renderDeleteConfirmationModal = () => {
    return (
      <DeleteConformationDialogBox
        title={'Confirm Delete!'}
        isVisible={isDeleteConfirmModalVisible}
        cancel={() => setIsDeleteConfirmModalVisible(false)}
        deleteOverlay={initializeDeleteDataset}
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
          title={'Delete Dataset'}
          titleStyle={overlayStyles.importantText}
          type={'clear'}
          disabled={isDisabled(dataset.id)}
          onPress={handleDeletePressed}
          icon={
            <Icon
              iconStyle={{paddingRight: 10}}
              name={'trash'}
              type={'font-awesome'}
              size={20}
              color={isDisabled(dataset.id) ? MEDIUMGREY : RED}
            />
          }
        />
        {isDisabled(dataset.id) && (
          <Text style={[overlayStyles.importantText, {paddingHorizontal: 30}]}>
            *{dataset.name} can not be deleted while still set as the selected (starred) dataset.
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
                style={formStyles.fieldValue}
                value={imagesCount.toString()}
                editable={false}
              />
            </View>
            {Platform.OS !== 'web' && imagesNeededCount === 0 && (
              <Icon
                name={'checkmark-outline'}
                type={'ionicon'}
                size={30}
                color={POSITIVE_COLOR}
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
                  style={formStyles.fieldValue}
                  value={imagesNeededCount.toString()}
                  editable={false}
                />
              </View>
              {imagesNeededCount > 0 && (
                <Icon
                  name={'download-circle-outline'}
                  type={'material-community'}
                  size={30}
                  color={WARNING_COLOR}
                  onPress={downloadImages}
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
                  name={'id'}
                  label={'ID'}
                  key={'id'}
                  editable={false}
                />
              </ListItem.Content>
            </ListItem>
            <FlatListItemSeparator/>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={DateInputField}
                  name={'date'}
                  label={'Date Created'}
                  key={'date'}
                  isDisplayOnly={true}
                  isShowTime={true}
                />
              </ListItem.Content>
            </ListItem>
            <FlatListItemSeparator/>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={DateInputField}
                  name={'modified_timestamp'}
                  label={'Date Last Modified'}
                  key={'modified_timestamp'}
                  isDisplayOnly={true}
                  isShowTime={true}
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
            style={formStyles.fieldValue}
            value={spotsCount.toString()}
            editable={false}
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
        title={datasetName === dataset.name ? 'Active Project' : 'Active Project (Save Changes)'}
        headerTitle={'Dataset Detail'}
        backButton={handleBackPressed}
      />

      {renderNameField()}
      <FlatListItemSeparator/>
      {renderMetadataForm()}
      <FlatListItemSeparator/>
      {renderSpotsField()}
      <FlatListItemSeparator/>
      {renderImagesField()}
      <FlatListItemSeparator/>
      <LittleSpacer/>
      {Platform.OS === 'web' && renderDeleteDatasetButton()}

      {/* Child Modal */}
      {isDeleteConfirmModalVisible && renderDeleteConfirmationModal()}
    </>
  );
};

export default DatasetDetail;
