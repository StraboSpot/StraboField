import React from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {MAIN_MENU_ITEMS, MAIN_MENU_TITLE} from './mainMenu.constants';
import {setMenuSelectionPage} from './mainMenuPanel.slice';
import mainMenuPanelStyles from './mainMenuPanel.styles';
import {truncateText} from '../../shared/Helpers';
import {HOME_MENU_HEADER2_SIZE} from '../../shared/styles.constants';
import {AvatarWrapper} from '../../shared/ui/avatars';

const MainMenuPanelHeader = () => {
  const dispatch = useDispatch();

  const settingsPageVisible = useSelector(state => state.mainMenu.mainMenuPageVisible);
  const projectName = useSelector(state => state.project.project?.description?.project_name);

  console.log('here', Object.values(MAIN_MENU_ITEMS.MY_STRABOSPOT));
  console.log('here2', !Object.values(MAIN_MENU_ITEMS.MY_STRABOSPOT).includes(settingsPageVisible));

  const doShowSubheader = !Object.values(MAIN_MENU_ITEMS.MY_STRABOSPOT).includes(settingsPageVisible) &&
    !Object.values(MAIN_MENU_ITEMS.SETTINGS).includes(settingsPageVisible);

  return (
    <View style={[mainMenuPanelStyles.mainMenuHeaderContainer, {paddingLeft: settingsPageVisible ? 0 : 10}]}>
      {settingsPageVisible ? (
        <View style={mainMenuPanelStyles.mainMenuIconContainer}>
          <Icon
            name={'arrow-back'}
            type={'ionicon'}
            color={'black'}
            iconStyle={mainMenuPanelStyles.buttons}
            onPress={() => dispatch(setMenuSelectionPage({name: null}))}
            size={30}
          />
        </View>
      ) : (
        <View style={[mainMenuPanelStyles.mainMenuIconContainer, {paddingHorizontal: 5, paddingVertical: 0}]}>
          <AvatarWrapper
            rounded
            size={30}
            source={require('../../assets/icons/strabospot.png')}
          />
        </View>
      )}
      <View style={{flex: 1, justifyContent: 'center'}}>
        {doShowSubheader ? (
          <>
            <Text style={mainMenuPanelStyles.headerText}>{settingsPageVisible || MAIN_MENU_TITLE}</Text>
            <Text style={mainMenuPanelStyles.subheaderText}>
              Project: {truncateText(projectName, settingsPageVisible ? 20 : 25) || 'Get Active Project'}
            </Text>
          </>
        ) : (
          <Text style={[mainMenuPanelStyles.headerText, {fontSize: HOME_MENU_HEADER2_SIZE}]}>
            {settingsPageVisible || MAIN_MENU_TITLE}
          </Text>
        )}
      </View>
    </View>
  );
};

export default MainMenuPanelHeader;
