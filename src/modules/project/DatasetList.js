import React, {useState} from 'react';
import {FlatList, Platform, Switch, Text, View} from 'react-native';

import {Button, Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {updatedDatasetProperties} from './projects.slice';
import useDownload from '../../services/useDownload';
import commonStyles from '../../shared/common.styles';
import {isEmpty, truncateText} from '../../shared/Helpers';
import DeleteConformationDialogBox from '../../shared/ui/DeleteConformationDialogBox';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import StandardModal from '../../shared/ui/StandardModal';
import TextInputModal from '../../shared/ui/TextInputModal';
import {setIsProjectLoadComplete} from '../home/home.slice';
import overlayStyles from '../home/overlays/overlay.styles';
import useProject from '../project/useProject';

const DatasetList = () => {
  console.log('Rendering DatasetList...');

  const {destroyDataset, makeDatasetCurrent, setSwitchValue} = useProject();
  const {initializeDownloadImages} = useDownload();

  const [selectedDataset, setSelectedDataset] = useState({});
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [isDatasetNameModalVisible, setIsDatasetNameModalVisible] = useState(false);
  const [isMakeDatasetCurrentModalVisible, setMakeIsDatasetCurrentModalVisible] = useState(false);
  const [selectedDatasetToEdit, setSelectedDatasetToEdit] = useState({});

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const datasets = useSelector(state => state.project.datasets) || {};
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const selectedDatasetId = useSelector(state => state.project.selectedDatasetId);

  const downloadImages = async (dataset) => {
    const imageRes = await initializeDownloadImages(dataset);
    console.log('Image Res', imageRes);
  };

  const editDataset = (id, name) => {
    setSelectedDatasetToEdit({name: name, id: id});
    setIsDatasetNameModalVisible(true);
  };

  const initializeDeleteDataset = () => {
    setIsDeleteConfirmModalVisible(false);
    if (selectedDatasetToEdit && selectedDatasetToEdit.id) {
      destroyDataset(selectedDatasetToEdit.id)
        // .then(() => setTimeout(() => dispatch(setIsStatusMessagesModalVisible(false))), 3000)
        .catch(err => console.log('Error deleting dataset', err));
    }
    else console.error('Selected dataset or id is undefined!');
  };

  const isDisabled = (id) => {
    return (activeDatasetsIds.length === 1 && activeDatasetsIds[0] === id)
      || (selectedDatasetId && selectedDatasetId === id);
  };

  const handleDeletePressed = () => {
    setIsDatasetNameModalVisible(false);
    setIsDeleteConfirmModalVisible(true);
  };

  const handleSetCurrentDatasetPressed = () => {
    makeDatasetCurrent(selectedDataset.id);
    setMakeIsDatasetCurrentModalVisible(false);
  };

  const renderDatasetListItem = (dataset) => {
    const needImages = isEmpty(dataset?.images?.neededImagesIds);
    const spotIds = dataset.spotIds
      ? `${dataset?.spotIds.length} spot${dataset?.spotIds.length !== 1 ? 's' : ''}`
      : '0 spots';
    const imagesNeededOfTotal = dataset.images
      && `${dataset?.images?.neededImagesIds?.length}/${dataset?.images?.imageIds?.length}`;
    const spotsText = spotIds?.length > 1 && `${spotIds}`;
    const imagesText = Platform.OS === 'web' ? `${dataset?.images?.imageIds?.length || 0} images`
      : imagesNeededOfTotal?.length > 1 ? `${imagesNeededOfTotal} images needed` : '0/0 images needed';
    return (
      <ListItem
        key={dataset.id}
        containerStyle={commonStyles.listItem}
      >
        <Icon
          name={'edit'}
          type={'material'}
          size={20}
          color={'darkgrey'}
          onPress={() => editDataset(dataset.id, dataset.name)}
        />
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{truncateText(dataset.name, 18)}</ListItem.Title>
          <ListItem.Subtitle style={commonStyles.listItemSubtitle}>
            {spotsText}, {'\n'}{imagesText}
          </ListItem.Subtitle>
        </ListItem.Content>
        <Switch
          onValueChange={value => onSwitch(value, dataset)}
          value={activeDatasetsIds.some(activeDatasetId => activeDatasetId === dataset.id)}
          disabled={isDisabled(dataset.id)}
        />
        {Platform.OS !== 'web' && (
          <View>
            {dataset.images?.imageIds && (
              <Icon
                name={spotIds && 'image-outline'}
                type={spotIds && 'ionicon'}
                size={20}
                containerStyle={{paddingBottom: 5}}
              />
            )}
            <Icon
              name={spotIds ? (needImages ? 'checkmark-outline' : 'download-circle-outline') : 'image-off-outline'}
              type={spotIds ? (needImages ? 'ionicon' : 'material-community') : 'material-community'}
              size={20}
              color={spotIds ? needImages && 'green' : 'black'}
              disabled={needImages}
              disabledStyle={{backgroundColor: 'transparent'}}
              onPress={() => downloadImages(dataset)}
            />
          </View>
        )}
      </ListItem>
    );
  };

  const renderDatasetNameChangeModal = () => {
    return (
      <View style={{backgroundColor: 'red', alignContent: 'flex-start'}}>
        <TextInputModal
          dialogTitle={'Edit Dataset Name'}
          visible={isDatasetNameModalVisible}
          onPress={() => saveDataset()}
          closeModal={() => setIsDatasetNameModalVisible(false)}
          value={selectedDatasetToEdit.name}
          onChangeText={text => setSelectedDatasetToEdit({...selectedDatasetToEdit, name: text})}
        >
          {/*<View style={{paddingBottom: 10}}>*/}
          {/*  <Button*/}
          {/*    title={'Delete Dataset'}*/}
          {/*    titleStyle={overlayStyles.importantText}*/}
          {/*    type={'clear'}*/}
          {/*    disabled={isDisabled(selectedDatasetToEdit.id)}*/}
          {/*    onPress={handleDeletePressed}*/}
          {/*    icon={*/}
          {/*      <Icon*/}
          {/*        iconStyle={{paddingRight: 10}}*/}
          {/*        name={'trash'}*/}
          {/*        type={'font-awesome'}*/}
          {/*        size={20}*/}
          {/*        color={'red'}*/}
          {/*      />*/}
          {/*    }*/}
          {/*  />*/}
          {/*  {isDisabled(selectedDatasetToEdit.id) && (*/}
          {/*    <Text style={overlayStyles.importantText}>*/}
          {/*      {selectedDatasetToEdit.name} can not be deleted while still selected as the current dataset.*/}
          {/*    </Text>*/}
          {/*  )}*/}
          {/*</View>*/}
        </TextInputModal>
      </View>
    );
  };

  const renderDeleteConfirmationModal = () => {
    return (
      <DeleteConformationDialogBox
        title={'Confirm Delete!'}
        isVisible={isDeleteConfirmModalVisible}
        cancel={() => setIsDeleteConfirmModalVisible(false)}
        deleteOverlay={() => initializeDeleteDataset()}
      >
        <Text style={{textAlign: 'center'}}>Are you sure you want to delete Dataset
          {selectedDatasetToEdit && selectedDatasetToEdit.name
            && <Text style={{}}>{'\n' + selectedDatasetToEdit.name}</Text>}
          ?
        </Text>
        <Text style={overlayStyles.statusMessageText}>
          This will
          <Text style={overlayStyles.importantText}> ERASE </Text>
          everything in this dataset including Spots, images, and all other data!
        </Text>
      </DeleteConformationDialogBox>
    );
  };

  const renderMakeDatasetCurrentModal = () => {
    return (
      <StandardModal
        dialogTitleStyle={{backgroundColor: 'green'}}
        visible={isMakeDatasetCurrentModalVisible && !isProjectLoadSelectionModalVisible}
        footerButtonsVisible={true}
        dialogTitle={'Make Current?'}
        rightButtonText={'Yes'}
        leftButtonText={'No'}
        onPress={handleSetCurrentDatasetPressed}
        closeModal={() => setMakeIsDatasetCurrentModalVisible(false)}
      >
        <View>
          <Text style={overlayStyles.statusMessageText}>
            By selecting &quot;Yes&quot; any new Spots will be saved into:
          </Text>
          <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>{selectedDataset.name}</Text>
        </View>
      </StandardModal>
    );
  };

  const saveDataset = () => {
    dispatch(updatedDatasetProperties(selectedDatasetToEdit));
    setIsDatasetNameModalVisible(false);
  };

  const onSwitch = async (val, dataset) => {
    setSelectedDataset(dataset);
    const value = await setSwitchValue(val, dataset);
    console.log('Value has been switched', value);
    val && setMakeIsDatasetCurrentModalVisible(true);
    dispatch(setIsProjectLoadComplete(true));
  };

  return (
    <View style={{flex: 1}}>
      <FlatList
        keyExtractor={item => item.id}
        data={Object.values(datasets)}
        renderItem={({item}) => renderDatasetListItem(item)}
        ItemSeparatorComponent={FlatListItemSeparator}
      />
      {renderDatasetNameChangeModal()}
      {renderDeleteConfirmationModal()}
      {renderMakeDatasetCurrentModal()}
    </View>
  );
};

export default DatasetList;
