import React from 'react';
import {Text} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {MAIN_MENU_ITEMS} from './mainMenu.constants';
import {setMenuSelectionPage} from './mainMenuPanel.slice';
import commonStyles from '../../shared/common.styles';
import {isEmpty, truncateText} from '../../shared/Helpers';
import {SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import useProject from '../project/useProject';

const MainMenuPanelListItem = ({onPress, title}) => {
  /* Data Hooks / State */

  const dispatch = useDispatch();

  const currentProjectId = useSelector(state => state.project.project?.id);

  const {getTargetDatasetFromId} = useProject();

  /* Event Handlers */

  const handleMenuItemPress = () => dispatch(setMenuSelectionPage({name: title}));

  /* Logic Helpers */

  const getTitle = () => {
    let subtitle;
    if (title === MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS) {
      let targetDatasetName = '';
      if (!isEmpty(currentProjectId)) {
        const targetDataset = getTargetDatasetFromId();
        if (targetDataset?.name) targetDatasetName = targetDataset?.name;
      }
      subtitle = '  (Target: ' + truncateText(targetDatasetName, 25) + ')';
    }

    return (
      <ListItem.Title style={commonStyles.listItemTitle}>
        {title}{subtitle && <Text style={{fontSize: SMALL_TEXT_SIZE, fontStyle: 'italic'}}>{subtitle}</Text>}
      </ListItem.Title>
    );
  };

  /* View */

  return (
    <ListItem containerStyle={commonStyles.listItem} onPress={onPress || handleMenuItemPress}>
      <ListItem.Content>{getTitle()}</ListItem.Content>
      <ListItem.Chevron/>
    </ListItem>
  );
};

export default MainMenuPanelListItem;
