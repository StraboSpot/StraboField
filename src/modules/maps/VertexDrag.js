import React from 'react';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {runOnJS, useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import {useDispatch, useSelector} from 'react-redux';

import {setVertexEndCoords} from './maps.slice';
import mapStyles from './maps.styles';

const selectedVertexOffset = 10;

const VertexDrag = ({onLongPress}) => {
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

  const panGesture = Gesture.Pan()
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

  // This overlay swallows the map's long press, so handle it here. Race with the pan: hold still opens the
  // modal, drag still moves the vertex.
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => runOnJS(handleLongPress)());

  const gesture = Gesture.Race(panGesture, longPressGesture);

  /* Logic Helpers */

  // Using function declarations (not const) so they are hoisted and available to runOnJS above
  function handleLongPress() {
    if (onLongPress) onLongPress();
  }

  function saveEnd(endCoords) {
    dispatch(setVertexEndCoords(endCoords));
  }

  /* View */

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[mapStyles.vertexEditPoint, animatedStyles]}/>
    </GestureDetector>
  );
};

export default VertexDrag;
