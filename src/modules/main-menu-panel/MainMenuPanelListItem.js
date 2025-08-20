import React from 'react';
import {Text} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import {MAIN_MENU_ITEMS} from './mainMenu.constants';
import {setMenuSelectionPage} from './mainMenuPanel.slice';
import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/Helpers';
import {SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import useProject from '../project/useProject';

const MainMenuPanelListItem = ({title}) => {
  const dispatch = useDispatch();

  const {getTargetDatasetFromId} = useProject();

  const targetDatasetName = getTargetDatasetFromId().name;

  const handleMenuItemPress = () => dispatch(setMenuSelectionPage({name: title}));

  const getTitle = () => {
    const subtitle = title === MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS
      && '  (Target: ' + truncateText(targetDatasetName, 25) + ')';
    return (
      <ListItem.Title style={commonStyles.listItemTitle}>
        {title}{subtitle && <Text style={{fontSize: SMALL_TEXT_SIZE, fontStyle: 'italic'}}>{subtitle}</Text>}
      </ListItem.Title>
    );
  };

  return (
    <ListItem containerStyle={commonStyles.listItem} onPress={handleMenuItemPress}>
      <ListItem.Content>{getTitle()}</ListItem.Content>
    </ListItem>
  );
};

export default MainMenuPanelListItem;
