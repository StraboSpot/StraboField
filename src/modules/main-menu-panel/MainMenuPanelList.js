import React, {useEffect, useState} from 'react';
import {Platform, SectionList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {
  MAIN_MENU_DATA,
  MAIN_MENU_DATA_NO_PROJECT,
  MAIN_MENU_DATA_NO_PROJECT_NO_USER,
  MAIN_MENU_DATA_NO_USER,
  MAIN_MENU_DATA_WEB,
} from './mainMenu.constants';
import {MENU_KEYWORDS} from './mainMenuKeywords.constants';
import {setSectionsCollapsed} from './mainMenuPanel.slice';
import MainMenuPanelListItem from './MainMenuPanelListItem';
import {isEmpty} from '../../shared/Helpers';
import {PRIMARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';

const MainMenuPanelList = ({searchText}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const encodedLogin = useSelector(state => state.user.encoded_login);
  const projectName = useSelector(state => state.project.project?.description?.project_name);
  const sectionsCollapsed = useSelector(state => state.mainMenu.sectionsCollapsed);

  /* Local State */

  const [menuItems, setMenuItems] = useState(MAIN_MENU_DATA);

  /* Side Effects */

  useEffect(() => {
    filterMenuItems();
  }, [searchText, projectName, encodedLogin]);

  /* Event Handlers */

  const onPressSectionAccordion = title => dispatch(setSectionsCollapsed(title));

  /* Logic Helpers */

  const filterMenuItems = () => {
    let mainMenuData = MAIN_MENU_DATA;
    if (Platform.OS === 'web') mainMenuData = MAIN_MENU_DATA_WEB;
    else if (!projectName && isEmpty(encodedLogin)) mainMenuData = MAIN_MENU_DATA_NO_PROJECT_NO_USER;
    else if (!projectName) mainMenuData = MAIN_MENU_DATA_NO_PROJECT;
    else if (isEmpty(encodedLogin)) mainMenuData = MAIN_MENU_DATA_NO_USER;

    if (searchText === '') setMenuItems(mainMenuData);
    else {
      const filteredItems = mainMenuData.reduce((acc, value) => {
        const {title, data} = value;
        const filteredPages = data.filter((d) => {
          const section = MENU_KEYWORDS[title]?.find(s => s.key === d);
          if (isEmpty(section)) return false;
          const foundMatches = section.keywords.filter(k => k.includes(searchText));
          return !isEmpty(foundMatches);
        });
        return isEmpty(filteredPages) ? acc : [...acc, {title: title, data: filteredPages}];
      }, []);
      setMenuItems(filteredItems);
    }
  };

  /* Render Functions */

  const renderItem = ({item, section}) => {
    if (!sectionsCollapsed.includes(section.title)) return <MainMenuPanelListItem title={item}/>;
  };

  const renderMenuSectionHeader = ({section: {title}}) => {
    return (
      <ListItem.Accordion
        containerStyle={{padding: 0, paddingRight: 10, backgroundColor: PRIMARY_BACKGROUND_COLOR}}
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

  /* View */

  return (
    <SectionList
      ItemSeparatorComponent={FlatListItemSeparator}
      keyExtractor={(item, index) => item + index}
      renderItem={renderItem}
      renderSectionHeader={renderMenuSectionHeader}
      sections={menuItems}
      stickySectionHeadersEnabled={true}
    />
  );
};

export default MainMenuPanelList;
