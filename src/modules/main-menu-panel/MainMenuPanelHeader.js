import React from 'react';
import {Platform, Pressable, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {MAIN_MENU_ITEMS, MAIN_MENU_TITLE} from './mainMenu.constants';
import {setMenuSelectionPage} from './mainMenuPanel.slice';
import mainMenuPanelStyles from './mainMenuPanel.styles';
import {truncateText} from '../../shared/helpers';
import {BLACK, MEDIUMGREY} from '../../shared/styles.constants';
import {AvatarWrapper} from '../../shared/ui/avatars';

const MainMenuPanelHeader = ({onTagsOverflowMenuPress}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project.project);
  const isSideMenuVisible = useSelector(state => state.mainMenu.isSidePanelVisible);
  const mainMenuPageVisible = useSelector(state => state.mainMenu.mainMenuPageVisible);
  const projectName = useSelector(state => state.project.project?.description?.project_name);

  /* Derived Variables */

  const doShowSubheader = !Object.values(MAIN_MENU_ITEMS.ACCOUNT).includes(mainMenuPageVisible)
    && !Object.values(MAIN_MENU_ITEMS.APP_SETTINGS).includes(mainMenuPageVisible)
    && !Object.values(MAIN_MENU_ITEMS.HELP).includes(mainMenuPageVisible);

  /* View */

  return (
    <View style={[mainMenuPanelStyles.mainMenuHeaderContainer, {paddingLeft: mainMenuPageVisible ? 0 : 10}]}>
      <Pressable onPress={() => dispatch(setMenuSelectionPage({name: null}))} style={{flex: 1, flexDirection: 'row'}}>
        {mainMenuPageVisible ? (
          !isSideMenuVisible && (
            <View style={mainMenuPanelStyles.mainMenuIconContainer}>
              <Icon
                iconStyle={mainMenuPanelStyles.buttons}
                name={'arrow-back'}
                size={30}
                type={'ionicon'}
              />
            </View>
          )
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
          {mainMenuPageVisible ? (
            <>
              {doShowSubheader ? (
                <>
                  <Text style={mainMenuPanelStyles.headerText}>{mainMenuPageVisible || MAIN_MENU_TITLE}</Text>
                  <Text style={mainMenuPanelStyles.subheaderText}>
                    Project: {truncateText(projectName, 22) || 'No Project Selected'}
                  </Text>
                </>
              ) : (
                <Text style={mainMenuPanelStyles.headerText}>
                  {mainMenuPageVisible || MAIN_MENU_TITLE}
                </Text>
              )}
            </>
          ) : (
            <View style={{flexDirection: 'row', flex: 1, alignItems: 'center'}}>
              {isReadOnlyProject && (
                <Icon
                  color={MEDIUMGREY}
                  containerStyle={{justifyContent: 'center', paddingRight: 5}}
                  name={'lock-closed'}
                  size={20}
                  type={'ionicon'}
                />
              )}
              <Text style={mainMenuPanelStyles.headerText}>
                {truncateText(projectName, isReadOnlyProject ? 30 : 35) || 'No Project Selected'}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      {!mainMenuPageVisible && Platform.OS !== 'web' && (
        <View style={[mainMenuPanelStyles.mainMenuIconContainer, {paddingLeft: 5}]}>
          <Icon
            color={BLACK}
            name={'swap-horizontal'}
            onPress={() => dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.ACCOUNT.STRABOFIELD_PROJECTS}))}
            size={25}
            type={'ionicon'}
          />
        </View>
      )}
      {mainMenuPageVisible && onTagsOverflowMenuPress && (
        <View style={[mainMenuPanelStyles.mainMenuIconContainer, {paddingLeft: 5}]}>
          <Icon
            color={BLACK}
            name={'ellipsis-vertical'}
            onPress={onTagsOverflowMenuPress}
            size={25}
            type={'ionicon'}
          />
        </View>
      )}
    </View>
  );
};

export default MainMenuPanelHeader;
