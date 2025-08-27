import React, {useState} from 'react';
import {Platform, Switch, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {truncateText} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import {WARNING_COLOR} from '../../../shared/styles.constants';
import {setIsProjectLoadComplete} from '../../home/home.slice';
import {SIDE_PANEL_VIEWS} from '../../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import useProject from '../useProject';

const DatasetListItem = ({dataset, setDatasetToView}) => {
  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const selectedDatasetId = useSelector(state => state.project.selectedDatasetId);

  const {makeDatasetCurrent, setSwitchValue} = useProject();

  const [isMakeDatasetCurrentModalVisible, setMakeIsDatasetCurrentModalVisible] = useState(false);

  const checked = selectedDatasetId && selectedDatasetId === dataset.id;
  const spotsCount = dataset.spotIds?.length || 0;
  const imagesCount = dataset?.images?.imageIds?.length || 0;
  const imagesNeededCount = dataset?.images?.neededImagesIds?.length || 0;
  const imagesIcon = <Icon name={'alert-circle-outline'} type={'ionicon'} color={WARNING_COLOR} size={12}/>;

  const viewDataset = () => {
    setDatasetToView(dataset);
    dispatch(setSidePanelVisible({view: SIDE_PANEL_VIEWS.DATASET_DETAIL, bool: true}));
  };

  const isActive = activeDatasetsIds.includes(dataset.id);

  const isDisabled = (id) => {
    return (activeDatasetsIds.length === 1 && activeDatasetsIds[0] === id)
      || (selectedDatasetId && selectedDatasetId === id);
  };

  const onSwitch = async (val) => {
    const value = await setSwitchValue(val, dataset);
    console.log('Value has been switched', value);
    dispatch(setIsProjectLoadComplete(true));
  };

  return (
    <View>
      <ListItem
        key={dataset.id}
        containerStyle={{paddingHorizontal: 10, paddingVertical: 5}}
        onPress={() => viewDataset(dataset.id, dataset.name)}
        pad={10}
      >
        <Switch
          onValueChange={onSwitch}
          value={isActive}
          disabled={isDisabled(dataset.id)}
        />

        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{truncateText(dataset.name, 18)}</ListItem.Title>
          <ListItem.Subtitle style={commonStyles.listItemSubtitle}>
            Spots: {spotsCount}, Images: {imagesCount} {imagesNeededCount > 0 && Platform.OS !== 'web' && imagesIcon}
          </ListItem.Subtitle>
        </ListItem.Content>

        <Icon
          name={checked ? 'star' : 'star-outline'}
          type={'ionicon'}
          color={checked ? themes.PRIMARY_ACCENT_COLOR : isActive ? themes.MEDIUMGREY : themes.SECONDARY_BACKGROUND_COLOR}
          onPress={() => makeDatasetCurrent(dataset.id)}
          disabled={!isActive}
          disabledStyle={{backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}}
        />

        <ListItem.Chevron/>
      </ListItem>
    </View>
  );
};

export default DatasetListItem;
