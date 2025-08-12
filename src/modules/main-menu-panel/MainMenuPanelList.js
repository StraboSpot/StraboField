import React from 'react';
import {Platform, SectionList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import {MAIN_MENU_DATA, MAIN_MENU_ITEMS} from './mainMenu.constants';
import {setMenuSelectionPage} from './mainMenuPanel.slice';
import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import useProject from '../project/useProject';

const MainMenuPanelList = () => {
  const dispatch = useDispatch();

  const {getSelectedDatasetFromId} = useProject();
  const targetDatasetName = getSelectedDatasetFromId().name;

  const renderMenuListItem = ({item}) => {

    const handleMenuItemPress = () => dispatch(setMenuSelectionPage({name: item}));

    if (item !== MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP && item !== MAIN_MENU_ITEMS.ACCOUNT.STRABOFIELD_PROJECTS
      && item !== MAIN_MENU_ITEMS.ACCOUNT.STRABOMICRO_PROJECTS && item !== MAIN_MENU_ITEMS.MAPS.MANAGE_OFFLINE_MAPS
      || ((item === MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP || item === MAIN_MENU_ITEMS.ACCOUNT.STRABOFIELD_PROJECTS
          || item === MAIN_MENU_ITEMS.ACCOUNT.STRABOMICRO_PROJECTS || item === MAIN_MENU_ITEMS.MAPS.MANAGE_OFFLINE_MAPS)
        && Platform.OS !== 'web')) {
      return (
        <ListItem containerStyle={commonStyles.listItem} onPress={handleMenuItemPress}>
          <ListItem.Content>
            {<ListItem.Title style={commonStyles.listItemTitle}>
              {item === MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS
                ? MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS + `(Target: ${truncateText(targetDatasetName, 25)})`
                : item
              }
            </ListItem.Title>}
          </ListItem.Content>
        </ListItem>
      );
    }
  };

  const renderMenuSectionHeader = ({section: {title}}) => {
    return <SectionDivider dividerText={title.split('_').join(' ')}/>;
  };

  return (
    <SectionList
      keyExtractor={(item, index) => item + index}
      sections={MAIN_MENU_DATA}
      renderItem={renderMenuListItem}
      renderSectionHeader={renderMenuSectionHeader}
      ItemSeparatorComponent={FlatListItemSeparator}
    />
  );
};

export default MainMenuPanelList;
