import React from 'react';
import {Platform, SectionList} from 'react-native';

import {useSelector} from 'react-redux';

import {MAIN_MENU_DATA, MAIN_MENU_DATA_NO_PROJECT, MAIN_MENU_DATA_WEB} from './mainMenu.constants';
import MainMenuPanelListItem from './MainMenuPanelListItem';
import {PRIMARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';

const MainMenuPanelList = () => {
  const projectName = useSelector(state => state.project.project?.description?.project_name);

  const renderItem = ({item}) => <MainMenuPanelListItem title={item}/>;

  const getMainMenuData = () => {
    if (Platform.OS === 'web') return MAIN_MENU_DATA_WEB;
    if (!projectName) return MAIN_MENU_DATA_NO_PROJECT;
    else return MAIN_MENU_DATA;
  };

  const renderMenuSectionHeader = ({section: {title}}) => {
    return (
      <SectionDivider dividerText={title.split('_').join(' ')} style={{backgroundColor: PRIMARY_BACKGROUND_COLOR}}/>
    );
  };

  return (
    <SectionList
      keyExtractor={(item, index) => item + index}
      sections={getMainMenuData()}
      renderItem={renderItem}
      renderSectionHeader={renderMenuSectionHeader}
      ItemSeparatorComponent={FlatListItemSeparator}
      stickySectionHeadersEnabled={true}
    />
  );
};

export default MainMenuPanelList;
