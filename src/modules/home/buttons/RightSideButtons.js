import React from 'react';
import {Animated, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {DrawActionButtons, ShortcutButtons} from './';
import NotebookButton from './NotebookButton';
import IconButton from '../../../shared/ui/IconButton';
import {MODAL_KEYS} from '../../page/page.constants';
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

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const stratSection = useSelector(state => state.map.stratSection);

  return (
    <>
      {stratSection && (
        <Animated.View style={[homeStyles.addIntervalButton, animateRightSide]}>
          <IconButton
            onPress={() => dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.ADD_INTERVAL}))}
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
