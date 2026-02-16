import React from 'react';
import {Platform, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {truncateText} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import {WARNING_COLOR} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui/';
import useProject from '../useProject';

const DatasetListItem = ({dataset, setDatasetToView}) => {
  /* Data Hooks / State */

  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const readOnlyDatasetsIds = useSelector(state => state.project.readOnlyDatasetsIds) || [];
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {makeDatasetCurrent, setSwitchValue} = useProject();

  /* Derived Variables */

  const checked = targetDatasetId && targetDatasetId === dataset.id;
  const imagesCount = dataset?.images?.imageIds?.length || 0;
  const imagesNeededCount = dataset?.images?.neededImagesIds?.length || 0;
  const isActive = activeDatasetsIds.includes(dataset.id);
  const isReadOnly = readOnlyDatasetsIds.includes(dataset.id);
  const spotsCount = dataset.spotIds?.length || 0;

  /* Event Handlers */

  const handleDatasetPressed = () => setDatasetToView(dataset);

  const onSwitch = async (val) => {
    const value = await setSwitchValue(val, dataset);
    console.log('Value has been switched', value);
  };

  /* Logic Helpers */

  const isDisabled = (id) => {
    return (activeDatasetsIds.length === 1 && activeDatasetsIds[0] === id) || (targetDatasetId && targetDatasetId === id);
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
        <SwitchWrapper disabled={isDisabled(dataset.id)} onValueChange={onSwitch} value={isActive}/>

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
          disabled={!isActive}
          disabledStyle={{backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}}
          name={checked ? 'star' : isReadOnly ? 'lock-closed' : 'star-outline'}
          onPress={() => makeDatasetCurrent(dataset.id)}
          type={'ionicon'}
        />

        <ListItem.Chevron/>
      </ListItem>
    </View>
  );
};

export default DatasetListItem;
