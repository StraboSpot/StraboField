import React, {useState} from 'react';
import {ActivityIndicator, Platform, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import useDownload from '../../../services/files/useDownload';
import commonStyles from '../../../shared/common.styles';
import {truncateText} from '../../../shared/helpers';
import * as themes from '../../../shared/styles.constants';
import {PRIMARY_TEXT_COLOR, PRIMARY_TEXT_SIZE, WARNING_COLOR} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui/';
import useProject from '../useProject';
import useDatasetNeededImagesCount from './useDatasetNeededImagesCount';

const DatasetPreferencesListItem = ({dataset}) => {
  /* Data Hooks */

  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {initializeDownloadImages} = useDownload();
  const {toggleActiveDataset, toggleTargetDataset} = useProject();
  const [imagesNeededCount, refreshImagesNeededCount] = useDatasetNeededImagesCount(dataset);

  /* Local State */

  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({downloaded: 0, total: 0});

  /* Derived Variables */

  const checked = targetDatasetId && targetDatasetId === dataset.id;
  const imagesCount = dataset?.images?.imageIds?.length || 0;
  const isActive = activeDatasetsIds.includes(dataset.id);
  const isReadOnly = dataset.isReadOnly;
  const spotsCount = dataset.spotIds?.length || 0;

  /* Event Handlers */

  const handleToggleActiveDataset = async (val) => {
    const value = await toggleActiveDataset(val, dataset);
    console.log('Value has been switched', value);
  };

  /* Logic Helpers */

  const downloadImages = async () => {
    setIsDownloadingImages(true);
    setDownloadProgress({downloaded: 0, total: imagesNeededCount});
    try {
      await initializeDownloadImages(dataset, (downloaded, total) => setDownloadProgress({downloaded, total}));
      await refreshImagesNeededCount();
    }
    catch (err) {
      console.error('Error downloading images:', err);
    }
    finally {
      setIsDownloadingImages(false);
    }
  };

  /* Render Functions */

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
            {isDownloadingImages
              ? `Downloading...\n${Math.max(downloadProgress.total - downloadProgress.downloaded, 0)} images left`
              : 'Download ' + imagesNeededCount.toString() + '\nNeeded '
              + (imagesNeededCount === 1 ? ' Image' : ' Images')}
          </Text>
        </ListItem.Content>
      </ListItem>
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
        <SwitchWrapper onValueChange={handleToggleActiveDataset} value={isActive}/>
      </ListItem>
    );
  };

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
          disabled={!isActive || isReadOnly}
          disabledStyle={{backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}}
          name={checked ? 'star' : isReadOnly ? 'lock-closed' : 'star-outline'}
          onPress={() => toggleTargetDataset(dataset.id)}
          type={'ionicon'}
        />
      </View>
    );
  };

  /* View */

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
        </View>
      </ListItem>
    </View>
  );
};

export default DatasetPreferencesListItem;
