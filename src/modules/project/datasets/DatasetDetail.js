import React, {useState} from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import {Button, Icon, ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useDownload from '../../../services/useDownload';
import commonStyles from '../../../shared/common.styles';
import {MEDIUMGREY, POSITIVE_COLOR, RED, WARNING_COLOR} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import LittleSpacer from '../../../shared/ui/LittleSpacer';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import {DateInputField, formStyles, NumberInputField} from '../../form';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import {updatedDatasetProperties} from '../projects.slice';

const DatasetDetail = ({dataset}) => {
  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {initializeDownloadImages} = useDownload();
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

  const isDisabled = (id) => {
    return (activeDatasetsIds.length === 1 && activeDatasetsIds[0] === id) || (targetDatasetId && targetDatasetId === id);
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
            <FlatListItemSeparator/>
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
            <FlatListItemSeparator/>
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
      {/*{isDeleteConfirmModalVisible && renderDeleteConfirmationModal()}*/}
    </>
  );
};

export default DatasetDetail;
