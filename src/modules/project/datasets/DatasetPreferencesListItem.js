import React, {useState} from 'react';
import {ActivityIndicator, Platform, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import useDownload from '../../../services/useDownload';
import commonStyles from '../../../shared/common.styles';
import {truncateText} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import {PRIMARY_TEXT_COLOR, PRIMARY_TEXT_SIZE, WARNING_COLOR} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui/';
import {setReadOnlyDatasetsIds} from '../projects.slice';
import useProject from '../useProject';

const DatasetPreferencesListItem = ({dataset}) => {
  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const readOnlyDatasetsIds = useSelector(state => state.project.readOnlyDatasetsIds) || [];
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {initializeDownloadImages} = useDownload();
  const {makeDatasetCurrent, setSwitchValue} = useProject();

  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [downloadedImages, setDownloadedImages] = useState(0);

  const checked = targetDatasetId && targetDatasetId === dataset.id;
  const imagesCount = dataset?.images?.imageIds?.length || 0;
  const imagesNeededCount = dataset?.images?.neededImagesIds?.length || 0;
  const isTarget = targetDatasetId === dataset.id;
  const spotsCount = dataset.spotIds?.length || 0;

  const isActive = activeDatasetsIds.includes(dataset.id);

  const downloadImages = async () => {
    setIsDownloadingImages(true);
    try {
      await initializeDownloadImages(dataset);
    }
    catch (err) {
      console.error('Error downloading images:', err);
    }
    finally {
      setIsDownloadingImages(false);
    }
  };

  const isDisabled = (id) => {
    return (activeDatasetsIds.length === 1 && activeDatasetsIds[0] === id) || (targetDatasetId && targetDatasetId === id);
  };

  const isReadOnly = readOnlyDatasetsIds.includes(dataset.id);

  const onSwitch = async (val) => {
    const value = await setSwitchValue(val, dataset);
    console.log('Value has been switched', value);
  };

  const onToggleReadOnly = () => dispatch(setReadOnlyDatasetsIds(dataset.id));

  const renderStateIcon = () => {
    return (
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <ListItem containerStyle={[commonStyles.listItemFormField, {paddingRight: 0}]}>
          <Text style={{color: PRIMARY_TEXT_COLOR, fontSize: PRIMARY_TEXT_SIZE}}>
            {checked ? 'Target Dataset' : ''}
          </Text>
        </ListItem>
        <Icon
          color={checked ? themes.PRIMARY_ACCENT_COLOR
            : isActive || isReadOnly ? themes.MEDIUMGREY
              : themes.SECONDARY_BACKGROUND_COLOR}
          containerStyle={{paddingRight: 10}}
          disabled={!isActive}
          disabledStyle={{backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}}
          name={checked ? 'star' : isReadOnly ? 'lock-closed' : 'star-outline'}
          onPress={() => makeDatasetCurrent(dataset.id)}
          type={'ionicon'}
        />
      </View>
    );
  };

  const renderIsActiveDatasetSwitch = () => {
    return (
      <ListItem containerStyle={[commonStyles.listItemFormField, {paddingRight: 0}]}>
        <ListItem.Content
          style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
        >
          <View style={{flex: 1}}>
            <Text style={{color: PRIMARY_TEXT_COLOR, fontSize: PRIMARY_TEXT_SIZE}}>{'Is Visible?'}</Text>
          </View>
        </ListItem.Content>
        <SwitchWrapper disabled={isDisabled(dataset.id)} onValueChange={onSwitch} value={isActive}/>
      </ListItem>
    );
  };

  const renderDownloadImages = () => {
    return (
      <ListItem
        containerStyle={[commonStyles.listItemFormField, {paddingHorizontal: 0}]}
        disabled={isDownloadingImages}
        onPress={downloadImages}
      >
        <ListItem.Content style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
          {isDownloadingImages ? (
            <ActivityIndicator color={WARNING_COLOR} size='small'/>
          ) : (
            <Icon
              color={WARNING_COLOR}
              name={'download-circle-outline'}
              size={30}
              type={'material-community'}
            />
          )}
          <Text style={{color: WARNING_COLOR, fontSize: PRIMARY_TEXT_SIZE, paddingLeft: 5, textAlign: 'left'}}>
            {isDownloadingImages ? `Downloading...\n${imagesNeededCount.toString()} images`
              : 'Download ' + imagesNeededCount.toString() + '\nNeeded '
              + (imagesNeededCount === 1 ? ' Image' : ' Images')}
          </Text>
        </ListItem.Content>
      </ListItem>
    );
  };

  const renderReadOnlyDatasetButton = () => {
    return (
      <ListItem containerStyle={[commonStyles.listItemFormField, {paddingRight: 0}]}>
        <ListItem.Content
          style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
        >
          <Text style={{color: PRIMARY_TEXT_COLOR, fontSize: PRIMARY_TEXT_SIZE}}>{'Is Read Only?'}</Text>
        </ListItem.Content>
        <SwitchWrapper disabled={isTarget} onValueChange={onToggleReadOnly} value={isReadOnly}/>
      </ListItem>
    );
  };

  return (
    <View>
      <ListItem
        containerStyle={{paddingHorizontal: 10, paddingVertical: 5}}
        key={dataset.id}
        pad={10}
      >
        <View style={{flex: 1, flexDirection: 'column'}}>
          <ListItem.Content>
            <ListItem.Title style={[commonStyles.listItemTitle, {fontWeight: 'bold'}]}>
              {truncateText(dataset.name, 30)}
            </ListItem.Title>
            <ListItem.Subtitle style={commonStyles.listItemSubtitle}>
              Spots: {spotsCount}{'\n'}
              Images: {imagesCount}
            </ListItem.Subtitle>
          </ListItem.Content>
          {Platform.OS !== 'web' && imagesNeededCount > 0 && renderDownloadImages()}
        </View>
        <View style={{flex: 1, flexDirection: 'column'}}>
          {renderStateIcon()}
          {renderIsActiveDatasetSwitch()}
          {renderReadOnlyDatasetButton()}
        </View>
      </ListItem>
    </View>
  );
};

export default DatasetPreferencesListItem;
