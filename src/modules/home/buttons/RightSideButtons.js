import React, {useEffect} from 'react';
import {Animated, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import useDeviceOrientation from '../useDeviceOrientation';
import {DrawActionButtons, ShortcutButtons} from './';
import NotebookButton from './NotebookButton';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {MAP_MODES} from '../../maps/maps.constants';
import {cancelledIntervalDrag} from '../../maps/maps.slice';
import {MODAL_KEYS} from '../../page/pageKeys.constants';
import {setModalVisible} from '../home.slice';
import homeStyles from '../home.style';
import DrawInfo from '../pop-ups/DrawInfo';

const RightSideButtons = ({
                            animateRightSide,
                            clickHandler,
                            closeNotebookPanel,
                            distance,
                            endMeasurement,
                            mapMode,
                            onCancel,
                            onEndDrawPressed,
                            openNotebookPanel,
                            selectingMode,
                          }) => {
  console.log('Rendering RightSideButtons...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const stratSection = useSelector(state => state.map.stratSection);

  const {lockOrientation, unlockOrientation} = useDeviceOrientation();

  useEffect(() => {
    if (mapMode === MAP_MODES.INTERVAL_DRAG) lockOrientation();
    else unlockOrientation();
  }, [mapMode]);

  /* View */

  return (
    <>
      {stratSection && (
        <Animated.View style={[homeStyles.addIntervalButton, animateRightSide]}>
          <IconButton
            onPress={() => {
              dispatch(cancelledIntervalDrag());
              dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.ADD_INTERVAL}));
            }}
            source={modalVisible === MODAL_KEYS.OTHER.ADD_INTERVAL
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
          <ShortcutButtons openNotebookPanel={openNotebookPanel}/>
        </Animated.View>
      )}

      <Animated.View style={[homeStyles.drawContainer, animateRightSide]}>
        <View style={{alignItems: 'flex-end'}}>
          <DrawInfo
            clickHandler={clickHandler}
            distance={distance}
            endMeasurement={endMeasurement}
            mapMode={mapMode}
            onCancel={onCancel}
            onEndDrawPressed={onEndDrawPressed}
            selectingMode={selectingMode}
          />
        </View>
        <DrawActionButtons
          clickHandler={clickHandler}
          fab={true}
          mapMode={mapMode}
        />
      </Animated.View>
    </>
  );
};

export default RightSideButtons;
