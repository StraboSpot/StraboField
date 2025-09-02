import React, {useState} from 'react';
import {Platform, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {truncateText} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import {WARNING_COLOR} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui/';
import {setIsProjectLoadComplete} from '../../home/home.slice';
import {SIDE_PANEL_VIEWS} from '../../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import useProject from '../useProject';

const DatasetListItem = ({dataset, setDatasetToView}) => {
  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {makeDatasetCurrent, setSwitchValue} = useProject();

  const [isMakeDatasetCurrentModalVisible, setMakeIsDatasetCurrentModalVisible] = useState(false);

  const checked = targetDatasetId && targetDatasetId === dataset.id;
  const spotsCount = dataset.spotIds?.length || 0;
  const imagesCount = dataset?.images?.imageIds?.length || 0;
  const imagesNeededCount = dataset?.images?.neededImagesIds?.length || 0;
  const imagesIcon = <Icon color={WARNING_COLOR} name={'alert-circle-outline'} size={12} type={'ionicon'}/>;

  const viewDataset = () => {
    setDatasetToView(dataset);
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.DATASET_DETAIL}));
  };

  const isActive = activeDatasetsIds.includes(dataset.id);

  const isDisabled = (id) => {
    return (activeDatasetsIds.length === 1 && activeDatasetsIds[0] === id) || (targetDatasetId && targetDatasetId === id);
  };

  const onSwitch = async (val) => {
    const value = await setSwitchValue(val, dataset);
    console.log('Value has been switched', value);
    dispatch(setIsProjectLoadComplete(true));
  };

  return (
    <View>
      <ListItem
        containerStyle={{paddingHorizontal: 10, paddingVertical: 5}}
        key={dataset.id}
        onPress={() => viewDataset(dataset.id, dataset.name)}
        pad={10}
      >
        <SwitchWrapper disabled={isDisabled(dataset.id)} onValueChange={onSwitch} value={isActive}/>

        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{truncateText(dataset.name, 18)}</ListItem.Title>
          <ListItem.Subtitle style={commonStyles.listItemSubtitle}>
            Spots: {spotsCount}, Images: {imagesCount} {imagesNeededCount > 0 && Platform.OS !== 'web' && imagesIcon}
          </ListItem.Subtitle>
        </ListItem.Content>

        <Icon
          color={checked ? themes.PRIMARY_ACCENT_COLOR : isActive ? themes.MEDIUMGREY : themes.SECONDARY_BACKGROUND_COLOR}
          disabled={!isActive}
          disabledStyle={{backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}}
          name={checked ? 'star' : 'star-outline'}
          onPress={() => makeDatasetCurrent(dataset.id)}
          type={'ionicon'}
        />

        <ListItem.Chevron/>
      </ListItem>
    </View>
  );
};

export default DatasetListItem;
