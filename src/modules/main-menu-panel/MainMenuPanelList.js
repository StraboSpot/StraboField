import React from 'react';
import {SectionList} from 'react-native';

import {MAIN_MENU_DATA} from './mainMenu.constants';
import MainMenuPanelListItem from './MainMenuPanelListItem';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';

const MainMenuPanelList = () => {

  const renderItem = ({item}) => <MainMenuPanelListItem title={item}/>;

  const renderMenuSectionHeader = ({section: {title}}) => <SectionDivider dividerText={title.split('_').join(' ')}/>;

  return (
    <SectionList
      keyExtractor={(item, index) => item + index}
      sections={MAIN_MENU_DATA}
      renderItem={renderItem}
      renderSectionHeader={renderMenuSectionHeader}
      ItemSeparatorComponent={FlatListItemSeparator}
    />
  );
};

export default MainMenuPanelList;
