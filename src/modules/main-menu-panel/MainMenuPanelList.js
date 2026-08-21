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
  MAIN_MENU_ITEMS_TO_HIDE_IF_IS_READ_ONLY_PROJECT,
  MAIN_MENU_SECTIONS_TO_HIDE_IF_IS_READ_ONLY_PROJECT,
} from './mainMenu.constants';
import {MENU_KEYWORDS} from './mainMenuKeywords.constants';
import {setSectionsCollapsed} from './mainMenuPanel.slice';
import MainMenuPanelListItem from './MainMenuPanelListItem';
import {isEmpty} from '../../shared/helpers';
import {PRIMARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';

// At module scope so useState's initializer can call it — a const in the component body isn't defined yet.
const getMainMenuData = (projectName, encodedLogin) => {
  if (Platform.OS === 'web') return MAIN_MENU_DATA_WEB;
  if (!projectName && isEmpty(encodedLogin)) return MAIN_MENU_DATA_NO_PROJECT_NO_USER;
  if (!projectName) return MAIN_MENU_DATA_NO_PROJECT;
  if (isEmpty(encodedLogin)) return MAIN_MENU_DATA_NO_USER;
  return MAIN_MENU_DATA;
};

const MainMenuPanelList = ({searchText}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const encodedLogin = useSelector(state => state.user.encoded_login);
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const projectName = useSelector(state => state.project.project?.description?.project_name);
  const sectionsCollapsed = useSelector(state => state.mainMenu.sectionsCollapsed);

  /* Local State */

  const [menuItems, setMenuItems] = useState(() => getMainMenuData(projectName, encodedLogin));

  /* Side Effects */

  useEffect(() => {
    filterMenuItems();
  }, [searchText, projectName, encodedLogin, isReadOnlyProject]);

  /* Event Handlers */

  const onPressSectionAccordion = title => dispatch(setSectionsCollapsed(title));

  /* Logic Helpers */

  const filterMenuItems = () => {
    let mainMenuData = getMainMenuData(projectName, encodedLogin);

    if (isReadOnlyProject) {
      mainMenuData = mainMenuData
        .filter(section => !MAIN_MENU_SECTIONS_TO_HIDE_IF_IS_READ_ONLY_PROJECT.includes(section.title))
        .map(section => ({
          ...section,
          data: section.data.filter(item => !MAIN_MENU_ITEMS_TO_HIDE_IF_IS_READ_ONLY_PROJECT.includes(item)),
        }));
    }

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
