import React from 'react';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {runOnJS, useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import {useDispatch, useSelector} from 'react-redux';

import {setVertexEndCoords} from './maps.slice';
import mapStyles from './maps.styles';

const selectedVertexOffset = 10;

const VertexDrag = () => {
  // console.log('Rendering VertexDrag...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const vertexStartCoords = useSelector(state => state.map.vertexStartCoords);

  /* Local State */

  const isPressed = useSharedValue(false);

  const vertexStartCoordsObj = {
    x: vertexStartCoords[0] - selectedVertexOffset,
    y: vertexStartCoords[1] - selectedVertexOffset,
  };

  const offset = useSharedValue(vertexStartCoordsObj);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{translateX: offset.value.x}, {translateY: offset.value.y}],
      backgroundColor: isPressed.value ? 'yellow' : 'orange',
    };
  });

  const start = useSharedValue(vertexStartCoordsObj);

  /* Derived Variables */

  const gesture = Gesture.Pan()
    .onBegin(() => {
      isPressed.value = true;
      // console.log('Start Coords:', vertexStartCoords);
    })
    .onUpdate((e) => {
      offset.value = {
        x: e.translationX + start.value.x,
        y: e.translationY + start.value.y,
      };
      // console.log('onUpdate coords [', offset.value.x, ',', offset.value.y, ']');
    })
    .onEnd(() => {
      start.value = {
        x: offset.value.x + selectedVertexOffset,
        y: offset.value.y + selectedVertexOffset,
      };
      let endCoords = [start.value.x, start.value.y];
      // console.log('End Coords:', endCoords);
      runOnJS(saveEnd)(endCoords);
    })
    .onFinalize(() => {
      // console.log('onFinalize');
      isPressed.value = false;
    });

  /* Logic Helpers */

  const saveEnd = (endCoords) => {
    dispatch(setVertexEndCoords(endCoords));
  };

  /* View */

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[mapStyles.vertexEditPoint, animatedStyles]}/>
    </GestureDetector>
  );
};

export default VertexDrag;
