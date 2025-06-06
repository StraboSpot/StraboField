import React from 'react';
import {Platform, SectionList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import {MAIN_MENU_DATA, MAIN_MENU_ITEMS} from './mainMenu.constants';
import {setMenuSelectionPage} from './mainMenuPanel.slice';
import commonStyles from '../../shared/common.styles';
import {toTitleCase} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';

const MainMenuPanelList = ({activeProject}) => {
  const dispatch = useDispatch();

  const renderMenuListItem = ({item}) => {

    const handleMenuItemPress = () => dispatch(setMenuSelectionPage({name: item}));

    if (item !== MAIN_MENU_ITEMS.MANAGE.UPLOAD_BACKUP_EXPORT && item !== MAIN_MENU_ITEMS.MANAGE.STRABOMICRO_PROJECTS
      && item !== MAIN_MENU_ITEMS.MAPS.MANAGE_OFFLINE_MAPS
      || ((item === MAIN_MENU_ITEMS.MANAGE.UPLOAD_BACKUP_EXPORT || item === MAIN_MENU_ITEMS.MANAGE.STRABOMICRO_PROJECTS
        || item === MAIN_MENU_ITEMS.MAPS.MANAGE_OFFLINE_MAPS) && Platform.OS !== 'web')) {
      return (
        <ListItem containerStyle={commonStyles.listItem} onPress={handleMenuItemPress}>
          <ListItem.Content>
            {<ListItem.Title style={commonStyles.listItemTitle}>
              {item === MAIN_MENU_ITEMS.MANAGE.ACTIVE_PROJECTS
                ? MAIN_MENU_ITEMS.MANAGE.ACTIVE_PROJECTS + ` (${activeProject})`
                : item
              }
            </ListItem.Title>}
          </ListItem.Content>
        </ListItem>
      );
    }
  };

  const renderMenuSectionHeader = ({section: {title}}) => <SectionDivider dividerText={toTitleCase(title)}/>;

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
