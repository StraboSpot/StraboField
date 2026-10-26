import React, {forwardRef, useContext, useEffect, useState} from 'react';
import {Platform, View} from 'react-native';

import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {Button, Header, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import ActionButtonsSmallScreen from './ActionButtonsSmallScreen';
import {HOME_ACTIONS, NAVIGATION_OPTIONS} from './home.constants';
import homeStyles from './home.styles';
import MainMenuButton from './MainMenuButton';
import ShortcutButtons from './shortcuts/ShortcutButtons';
import useDeviceOrientation from '../../services/device/useDeviceOrientation';
import * as themes from '../../shared/styles.constants';
import IconButton from '../../shared/ui/buttons/IconButton';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import MapContainer from '../maps/MapContainer';
import {MapEditContext} from '../maps/MapEditContext';
import {MAP_MODES} from '../maps/maps.constants';
import {canceledIntervalDrag} from '../maps/maps.slice';
import OfflineMapPreviewBanner from '../maps/offline-maps/OfflineMapPreviewBanner';
import {LeavePageContext} from '../notebook-panel/LeavePageContext';
import NotebookPanel from '../notebook-panel/NotebookPanel';
import BackupStatusIcons from '../project/backup/BackupStatusIcons';
import SpotNavigator from '../spots/SpotNavigator';
import useSpots from '../spots/useSpots';
import VersionCheckLabel from '../version-check/VersionCheckLabel';

const Tab = createMaterialTopTabNavigator();

const HomeViewSmallScreen = forwardRef(({
                                          closeMainMenuPanel,
                                          closeNotebookPanel,
                                          distance,
                                          endMeasurement,
                                          handleHomeAction,
                                          handleHomeActionFromMapMenu,
                                          hasDrawTools,
                                          isCreateToolsDisabled,
                                          mapMenus,
                                          mapMode,
                                          onCancel,
                                          onEndDrawPressed,
                                          openMainMenuPanel,
                                          openNotebookPanel,
                                          openSpotInNotebook,
                                          selectingMode,
                                          setDistance,
                                          setMapModeToEdit,
                                          toggleMapMenu,
                                        }, mapComponentRef) => {
  console.log('Rendering HomeViewSmallScreen...');

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const stratSection = useSelector(state => state.map.stratSection);
  const {confirmLeavePage, hasUnsavedPageChanges, isPageChanged} = useContext(LeavePageContext);
  const {confirmEndMapEditing, isMapEditing} = useContext(MapEditContext);

  const [isShowingSpotNavigator, setIsShowingSpotNavigator] = useState(false);

  const {height, width} = useWindowSize();
  const {isCurrentMapReadOnly} = useSpots();
  const {lockToPortrait} = useDeviceOrientation();

  useEffect(() => {
    Platform.OS !== 'web' && lockToPortrait();
  }, []);

  // The navigator hides only while the Notebook shows, so leaving it open would bring it back, in place of the
  // map, the moment the Notebook closes.
  const openSpotInNotebookAndCloseNavigator = (spot, notebookPage, attributes) => {
    setIsShowingSpotNavigator(false);
    openSpotInNotebook(spot, notebookPage, attributes);
  };

  // The navigator takes the place of the map, so a map edit ends first, and of the Notebook, so its page is asked about
  const toggleSpotNavigator = async () => {
    if (isMapEditing() && !await confirmEndMapEditing()) return;
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    dispatch(canceledIntervalDrag());
    closeNotebookPanel();
    setIsShowingSpotNavigator(s => !s);
  };

  return (
    <>
      <Header
        backgroundColor={themes.SECONDARY_BACKGROUND_COLOR}
        barStyle={'dark-content'}
        centerComponent={
          <Button
            icon={!isShowingSpotNavigator && (
              <Icon
                color={themes.PRIMARY_TEXT_COLOR}
                name={'chevron-forward'}
                type={'ionicon'}
              />
            )}
            iconRight
            onPress={toggleSpotNavigator}
            size={'sm'}
            title={isShowingSpotNavigator ? 'Spot Navigator' : selectedSpot?.properties?.name || 'Spot Navigator'}
            titleStyle={{color: themes.PRIMARY_TEXT_COLOR, fontSize: themes.PRIMARY_HEADER_TEXT_SIZE}}
            type={'clear'}
          />
        }
        centerContainerStyle={{justifyContent: 'center'}}
        edges={'top'}
        leftComponent={isShowingSpotNavigator && !isNotebookPanelVisible ? (
          <Icon
            color={themes.PRIMARY_TEXT_COLOR}
            name={'chevron-back'}
            onPress={toggleSpotNavigator}
            type={'ionicon'}
          />
        ) : <MainMenuButton closeMainMenuPanel={closeMainMenuPanel} openMainMenuPanel={openMainMenuPanel}/>}
        rightComponent={<BackupStatusIcons/>}
      />
      {isShowingSpotNavigator && !isNotebookPanelVisible ? (
        <SpotNavigator
          closeSpotsNavigator={toggleSpotNavigator}
          openMainMenuPanel={openMainMenuPanel}
          openNotebookPanel={openNotebookPanel}
          openSpotInNotebook={openSpotInNotebookAndCloseNavigator}
        />
      ) : (
        <Tab.Navigator
          screenListeners={{focus: () => dispatch(canceledIntervalDrag())}}
          screenOptions={{
            // A swipe can't wait for an answer, so it is off while there is one to give: a map edit or interval drag
            // to end before the Notebook shows, or a notebook page's unsaved changes before the Map does
            swipeEnabled: mapMode !== MAP_MODES.EDIT && mapMode !== MAP_MODES.INTERVAL_DRAG && !isPageChanged,
            tabBarIndicatorContainerStyle: {backgroundColor: themes.SECONDARY_BACKGROUND_COLOR},
            tabBarIndicatorStyle: {backgroundColor: themes.BLACK, height: 5},
            tabBarItemStyle: {padding: 0},
            tabBarLabelStyle: {fontSize: themes.PRIMARY_HEADER_TEXT_SIZE, color: themes.PRIMARY_TEXT_COLOR},
            tabBarStyle: {backgroundColor: themes.SECONDARY_BACKGROUND_COLOR, marginTop: -10},
          }}
        >
          <Tab.Screen
            // Showing the Map closes the Notebook and the page on it
            listeners={({navigation}) => ({
              tabPress: async (e) => {
                if (!hasUnsavedPageChanges()) return;
                e.preventDefault();
                if (await confirmLeavePage()) navigation.navigate('Map');
              },
            })}
            name={'Map'}
            options={{
              ...NAVIGATION_OPTIONS,
              tabBarLabel: stratSection ? 'Strat Section'
                : currentImageBasemap ? 'Image Basemap'
                  : 'Map',
            }}
          >
            {() =>
              <>
                <MapContainer
                  mapMode={mapMode}
                  onEndDrawPressed={onEndDrawPressed}
                  ref={mapComponentRef}
                  selectingMode={selectingMode}
                  setDistance={setDistance}
                  setMapModeToEdit={setMapModeToEdit}
                />

                {currentImageBasemap && (
                  <IconButton
                    onPress={() => handleHomeAction(HOME_ACTIONS.CLOSE_IMAGE_BASEMAP)}
                    source={require('../../assets/icons/Close.png')}
                    style={homeStyles.closeButtonSmallScreen}
                  />
                )}
                {stratSection && (
                  <IconButton
                    onPress={() => handleHomeAction(HOME_ACTIONS.CLOSE_STRAT_SECTION)}
                    source={require('../../assets/icons/Close.png')}
                    style={homeStyles.closeButtonSmallScreen}
                  />
                )}

                {stratSection && !isCurrentMapReadOnly() && !isCreateToolsDisabled && (
                  <IconButton
                    onPress={() => handleHomeAction(HOME_ACTIONS.ADD_INTERVAL)}
                    source={require('../../assets/icons/AddIntervalButton.png')}
                    style={homeStyles.addIntervalButton}
                  />
                )}

                {!currentImageBasemap && !stratSection && (
                  <View style={homeStyles.shortcutButtons}>
                    <ShortcutButtons openNotebookPanel={openNotebookPanel}/>
                  </View>
                )}

                <View
                  style={[homeStyles.actionButtonsSmallScreenContainer,
                    width < height ? homeStyles.actionButtonsSmallScreenContainerPortrait
                      : homeStyles.actionButtonsSmallScreenContainerLandscape]}
                >
                  <ActionButtonsSmallScreen
                    distance={distance}
                    endMeasurement={endMeasurement}
                    handleHomeAction={handleHomeAction}
                    handleHomeActionFromMapMenu={handleHomeActionFromMapMenu}
                    hasDrawTools={hasDrawTools}
                    mapMenus={mapMenus}
                    mapMode={mapMode}
                    onCancel={onCancel}
                    onEndDrawPressed={onEndDrawPressed}
                    openMainMenuPanel={openMainMenuPanel}
                    selectingMode={selectingMode}
                    toggleMapMenu={toggleMapMenu}
                    zoomToCustomMap={bbox => mapComponentRef?.current?.zoomToCustomMap(bbox)}
                  />
                </View>

                <OfflineMapPreviewBanner/>
                <VersionCheckLabel/>
              </>
            }
          </Tab.Screen>
          <Tab.Screen
            // While editing, the tab opens the notebook through openNotebookPanel, which ends the edit first
            listeners={{
              tabPress: (e) => {
                if (!isMapEditing()) return;
                e.preventDefault();
                openNotebookPanel();
              },
            }}
            name={'Notebook'}
            options={NAVIGATION_OPTIONS}
          >
            {() =>
              <NotebookPanel
                closeNotebookPanel={closeNotebookPanel}
                createDefaultGeom={() => mapComponentRef.current?.createDefaultGeom()}
                openMainMenuPanel={openMainMenuPanel}
                zoomToSpots={spots => mapComponentRef.current?.zoomToSpots(spots)}
              />
            }
          </Tab.Screen>
        </Tab.Navigator>
      )}
    </>
  );
});

export default HomeViewSmallScreen;
