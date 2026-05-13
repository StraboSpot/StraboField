import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {MAIN_MENU_ITEMS} from './mainMenu.constants';
import {setMenuSelectionPage} from './mainMenuPanel.slice';
import commonStyles from '../../shared/common.styles';
import {isEmpty, truncateText} from '../../shared/helpers';
import {SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import useProject from '../project/useProject';

const MainMenuPanelListItem = ({onPress, title}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentProjectId = useSelector(state => state.project.project?.id);

  const {getTargetDatasetFromId} = useProject();

  /* Local State */

  const [targetDatasetName, setTargetDatasetName] = useState('');

  /* Side Effects */

  useEffect(() => {
    if (title === MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS && !isEmpty(currentProjectId)) {
      const targetDataset = getTargetDatasetFromId();
      setTargetDatasetName(targetDataset?.name || '');
    }
  }, [currentProjectId, title]);

  /* Event Handlers */

  const handleMenuItemPress = () => dispatch(setMenuSelectionPage({name: title}));

  /* Logic Helpers */

  const getTitle = () => {
    const subtitle = title === MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS
      ? '  (Target: ' + truncateText(targetDatasetName, 25) + ')'
      : undefined;

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
