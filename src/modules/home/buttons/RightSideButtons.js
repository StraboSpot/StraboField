import React, {useEffect} from 'react';
import {Animated, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import useDeviceOrientation from '../useDeviceOrientation';

import {DrawActionButtons, ShortcutButtons} from './';
import NotebookButton from './NotebookButton';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {setIsDragIntervalMode} from '../../maps/maps.slice';
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
  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const stratSection = useSelector(state => state.map.stratSection);

  const {lockToPortrait, unlockOrientation} = useDeviceOrientation();

  useEffect(() => {
    if (isDragIntervalMode) lockToPortrait();
    else unlockOrientation();
  }, [isDragIntervalMode]);

  /* View */

  return (
    <>
      {stratSection && (
        <Animated.View style={[homeStyles.dragIntervalButton, animateRightSide]}>
          <IconButton
            onPress={() => dispatch(setIsDragIntervalMode(!isDragIntervalMode))}
            source={isDragIntervalMode
              ? require('../../../assets/icons/DragIntervalButton_pressed.png')
              : require('../../../assets/icons/DragIntervalButton.png')}
          />
        </Animated.View>
      )}

      {stratSection && (
        <Animated.View style={[homeStyles.addIntervalButton, animateRightSide]}>
          <IconButton
            onPress={() => {
              dispatch(setIsDragIntervalMode(false));
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
          mapMode={mapMode}
        />
      </Animated.View>
    </>
  );
};

export default RightSideButtons;
