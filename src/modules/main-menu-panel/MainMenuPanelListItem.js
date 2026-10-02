import React from 'react';
import {Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {MAIN_MENU_ITEMS} from './mainMenu.constants';
import {setMenuSelectionPage} from './mainMenuPanel.slice';
import commonStyles from '../../shared/common.styles';
import {isEmpty, truncateText} from '../../shared/helpers';
import {CAUTION_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';

const subtitleStyle = {fontSize: SMALL_TEXT_SIZE, fontStyle: 'italic'};
const noTargetIconStyle = {paddingLeft: 8, paddingRight: 3};
const noTargetRowStyle = {alignItems: 'center', flexDirection: 'row'};
const noTargetTextStyle = {...subtitleStyle, color: CAUTION_COLOR};

const MainMenuPanelListItem = ({onPress, title}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentProjectId = useSelector(state => state.project.project?.id);
  const isReadOnlyProject = useSelector(state => state.project.project?.isReadOnly);
  const targetDatasetName = useSelector(state => state.project.datasets?.[state.project.targetDatasetId]?.name);

  /* Derived Variables */

  // A read only project takes no new Spots, so it has no target dataset to show or to warn about
  const isDatasetsItem = title === MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS && !isEmpty(currentProjectId)
    && !isReadOnlyProject;
  const isTargetDatasetMissing = isDatasetsItem && isEmpty(targetDatasetName);

  /* Event Handlers */

  const handleMenuItemPress = () => dispatch(setMenuSelectionPage({name: title}));

  /* Render Functions */

  const renderTitle = () => (
    <ListItem.Title style={commonStyles.listItemTitle}>
      {title}
      {isDatasetsItem && !isTargetDatasetMissing && (
        <Text style={subtitleStyle}>{'  (Target: ' + truncateText(targetDatasetName, 25) + ')'}</Text>
      )}
    </ListItem.Title>
  );

  // In a row rather than nested in the title's text, where the icon would sit on the baseline instead of centered
  const renderTitleWithNoTargetDataset = () => (
    <View style={noTargetRowStyle}>
      {renderTitle()}
      <Icon color={CAUTION_COLOR} containerStyle={noTargetIconStyle} name={'warning-amber'} size={SMALL_TEXT_SIZE}/>
      <Text style={noTargetTextStyle}>(No target dataset)</Text>
    </View>
  );

  /* View */

  return (
    <ListItem containerStyle={commonStyles.listItem} onPress={onPress || handleMenuItemPress}>
      <ListItem.Content>
        {isTargetDatasetMissing ? renderTitleWithNoTargetDataset() : renderTitle()}
      </ListItem.Content>
      <ListItem.Chevron/>
    </ListItem>
  );
};

export default MainMenuPanelListItem;
