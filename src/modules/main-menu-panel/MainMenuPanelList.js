import React from 'react';
import {Platform, SectionList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {MAIN_MENU_DATA, MAIN_MENU_DATA_NO_PROJECT, MAIN_MENU_DATA_WEB} from './mainMenu.constants';
import {setSectionsCollapsed} from './mainMenuPanel.slice';
import MainMenuPanelListItem from './MainMenuPanelListItem';
import {PRIMARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';

const MainMenuPanelList = () => {
  const dispatch = useDispatch();
  const projectName = useSelector(state => state.project.project?.description?.project_name);
  const sectionsCollapsed = useSelector(state => state.mainMenu.sectionsCollapsed);


  const renderItem = ({item, section}) => {
    if (!sectionsCollapsed.includes(section.title)) return <MainMenuPanelListItem title={item}/>;
  };

  const onPressSectionAccordion = title => dispatch(setSectionsCollapsed(title));

  const getMainMenuData = () => {
    if (Platform.OS === 'web') return MAIN_MENU_DATA_WEB;
    if (!projectName) return MAIN_MENU_DATA_NO_PROJECT;
    else return MAIN_MENU_DATA;
  };

  const renderMenuSectionHeader = ({section: {title}}) => {
    return (
      <ListItem.Accordion
        key={'section_header'}
        containerStyle={{backgroundColor: PRIMARY_BACKGROUND_COLOR, padding: 0, paddingRight: 10}}
        content={
          <ListItem.Content>
            <SectionDivider dividerText={title.split('_').join(' ')}/>
          </ListItem.Content>
        }
        isExpanded={!sectionsCollapsed.includes(title)}
        onPress={() => onPressSectionAccordion(title)}
      />
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
