import React from 'react';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {useTags} from '.';
import TagColorIcon from './TagColorIcon';
import commonStyles from '../../shared/common.styles';
import {toTitleCase} from '../../shared/Helpers';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {setSelectedTag} from '../project/projects.slice';

const TagsListItem = ({
                        isCheckBoxVisible,
                        isChecked,
                        isChevronVisible,
                        onChecked,
                        onPress,
                        openMainMenuPanel,
                        tag,
                      }) => {
  const {getTagLabel} = useTags();
  const dispatch = useDispatch();
  const isMainMenuPanelVisible = useSelector(state => state.home.isMainMenuPanelVisible);

  const openTag = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_DETAIL}));
    dispatch(setSelectedTag(tag));
    if (tag.type === 'geologic_unit') {
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS}));
    }
    else dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.PROJECT_DATA.TAGS}));
    if (!isMainMenuPanelVisible) openMainMenuPanel();
  };

  return (
    <ListItem
      containerStyle={commonStyles.listItem}
      key={tag.id}
      onPress={() => onPress ? onPress(tag) : isChevronVisible ? openTag() : onChecked()}
      pad={5}
    >
      <TagColorIcon color={tag.color}/>
      <ListItem.Content>
        <ListItem.Title style={commonStyles.listItemTitle}>{tag.name}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Content>
        <ListItem.Title style={commonStyles.listItemTitle}>{toTitleCase(getTagLabel(tag.type))}</ListItem.Title>
      </ListItem.Content>
      {isCheckBoxVisible && <ListItem.CheckBox checked={isChecked} onPress={onChecked}/>}
      {isChevronVisible && <ListItem.Chevron/>}
    </ListItem>
  );
};
export default TagsListItem;
