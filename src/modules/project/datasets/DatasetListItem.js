import React from 'react';
import {Platform, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import useDatasetNeededImagesCount from './useDatasetNeededImagesCount';
import commonStyles from '../../../shared/common.styles';
import {truncateText} from '../../../shared/helpers';
import * as themes from '../../../shared/styles.constants';
import {WARNING_COLOR} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui/';
import useProject from '../useProject';

const DatasetListItem = ({dataset, setDatasetToView}) => {
  /* Data Hooks */

  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const {targetDatasetId} = useSelector(state => state.project);

  const [imagesNeededCount] = useDatasetNeededImagesCount(dataset);
  const {toggleActiveDataset, toggleTargetDataset} = useProject();

  /* Derived Variables */

  const checked = targetDatasetId && targetDatasetId === dataset.id;
  const imagesCount = dataset?.images?.imageIds?.length || 0;
  const isActive = activeDatasetsIds.includes(dataset.id);
  const isReadOnly = dataset.isReadOnly;
  const spotsCount = dataset.spotIds?.length || 0;

  /* Event Handlers */

  const handleDatasetPressed = () => setDatasetToView(dataset);

  const handleToggleActiveDataset = async (val) => {
    const value = await toggleActiveDataset(val, dataset);
    console.log('Active dataset has been switched', value);
  };

  /* View */

  return (
    <View>
      <ListItem
        containerStyle={{paddingHorizontal: 10, paddingVertical: 5}}
        key={dataset.id}
        onPress={handleDatasetPressed}
        pad={10}
      >
        <SwitchWrapper
          disabled={false}
          onValueChange={handleToggleActiveDataset}
          value={isActive}
        />

        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{truncateText(dataset.name, 18)}</ListItem.Title>
          <ListItem.Subtitle style={commonStyles.listItemSubtitle}>
            Spots: {spotsCount}{'\n'}
            Images: {imagesCount}
            {imagesNeededCount > 0 && Platform.OS !== 'web' && (
              <Text style={{color: WARNING_COLOR}}> (MISSING {imagesNeededCount})</Text>
            )}
          </ListItem.Subtitle>
        </ListItem.Content>

        <Icon
          color={checked ? themes.PRIMARY_ACCENT_COLOR : isActive || isReadOnly ? themes.MEDIUMGREY
            : themes.SECONDARY_BACKGROUND_COLOR}
          disabled={!isActive || isReadOnly}
          disabledStyle={{backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}}
          name={checked ? 'star' : isReadOnly ? 'lock-closed' : 'star-outline'}
          onPress={() => toggleTargetDataset(dataset.id)}
          type={'ionicon'}
        />

        <ListItem.Chevron/>
      </ListItem>
    </View>
  );
};

export default DatasetListItem;
