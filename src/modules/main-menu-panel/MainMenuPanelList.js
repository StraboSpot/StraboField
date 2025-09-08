import React from 'react';
import {Platform, SectionList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {MAIN_MENU_DATA, MAIN_MENU_DATA_NO_PROJECT, MAIN_MENU_DATA_WEB} from './mainMenu.constants';
import {setSectionsCollapsed} from './mainMenuPanel.slice';
import MainMenuPanelListItem from './MainMenuPanelListItem';
import {MEDIUMGREY} from '../../shared/styles.constants';
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
        containerStyle={{padding: 0, paddingRight: 10, borderBottomWidth: 1, borderColor: MEDIUMGREY}}
        content={
          <ListItem.Content>
            <SectionDivider dividerText={title.split('_').join(' ')} style={{borderBottomWidth: 0}}/>
          </ListItem.Content>
        }
        isExpanded={!sectionsCollapsed.includes(title)}
        key={'section_header'}
        onPress={() => onPressSectionAccordion(title)}
      />
    );
  };

  return (
    <SectionList
      ItemSeparatorComponent={FlatListItemSeparator}
      keyExtractor={(item, index) => item + index}
      renderItem={renderItem}
      renderSectionHeader={renderMenuSectionHeader}
      sections={getMainMenuData()}
      stickySectionHeadersEnabled={true}
    />
  );
};

export default MainMenuPanelList;
