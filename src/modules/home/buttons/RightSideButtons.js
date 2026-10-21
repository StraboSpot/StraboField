import React, {useEffect} from 'react';
import {Animated, View} from 'react-native';

import {useSelector} from 'react-redux';

import useDeviceOrientation from '../useDeviceOrientation';
import DrawActionButtons from './DrawActionButtons';
import NotebookButton from './NotebookButton';
import ShortcutButtons from './ShortcutButtons';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {MAP_MODES} from '../../maps/maps.constants';
import {MODAL_KEYS} from '../../page/pageKeys.constants';
import useSpots from '../../spots/useSpots';
import {HOME_ACTIONS} from '../home.constants';
import homeStyles from '../home.styles';
import DrawInfo from '../pop-ups/DrawInfo';

const RightSideButtons = ({
                            animateRightSide,
                            closeNotebookPanel,
                            confirmEndMapEditing,
                            distance,
                            endMeasurement,
                            handleHomeAction,
                            hasDrawTools,
                            isCreateToolsDisabled,
                            isMapEditing,
                            mapMode,
                            onCancel,
                            onEndDrawPressed,
                            openMainMenuPanel,
                            openNotebookPanel,
                            selectingMode,
                          }) => {
  console.log('Rendering RightSideButtons...');

  /* Data Hooks */

  const activeModal = useSelector(state => state.home.activeModal);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const stratSection = useSelector(state => state.map.stratSection);

  const {isCurrentMapReadOnly} = useSpots();
  const {lockOrientation, unlockOrientation} = useDeviceOrientation();

  useEffect(() => {
    if (mapMode === MAP_MODES.INTERVAL_DRAG || mapMode === MAP_MODES.EDIT) lockOrientation();
    else unlockOrientation();
  }, [mapMode]);

  /* View */

  return (
    <>
      {stratSection && !isCurrentMapReadOnly() && !isCreateToolsDisabled && (
        <Animated.View style={[homeStyles.addIntervalButton, animateRightSide]}>
          <IconButton
            onPress={() => handleHomeAction(HOME_ACTIONS.ADD_INTERVAL)}
            source={activeModal === MODAL_KEYS.OTHER.ADD_INTERVAL
              ? require('../../../assets/icons/AddIntervalButton_pressed.png')
              : require('../../../assets/icons/AddIntervalButton.png')}
          />
        </Animated.View>
      )}

      <Animated.View style={[homeStyles.notebookButton, animateRightSide]}>
        <NotebookButton closeNotebookPanel={closeNotebookPanel} openNotebookPanel={openNotebookPanel}/>
      </Animated.View>

      {!currentImageBasemap && !stratSection && (
        <Animated.View style={[homeStyles.shortcutButtons, animateRightSide]}>
          <ShortcutButtons
            confirmEndMapEditing={confirmEndMapEditing}
            isMapEditing={isMapEditing}
            openNotebookPanel={openNotebookPanel}
          />
        </Animated.View>
      )}

      <Animated.View style={[homeStyles.drawContainer, animateRightSide]}>
        <View style={{alignItems: 'flex-end'}}>
          <DrawInfo
            distance={distance}
            endMeasurement={endMeasurement}
            handleHomeAction={handleHomeAction}
            mapMode={mapMode}
            onCancel={onCancel}
            onEndDrawPressed={onEndDrawPressed}
            selectingMode={selectingMode}
          />
        </View>
        {hasDrawTools && (
          <DrawActionButtons
            handleHomeAction={handleHomeAction}
            mapMode={mapMode}
            openMainMenuPanel={openMainMenuPanel}
          />
        )}
      </Animated.View>
    </>
  );
};

export default RightSideButtons;
