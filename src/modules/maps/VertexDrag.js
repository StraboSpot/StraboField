import React from 'react';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {useDispatch, useSelector} from 'react-redux';

import {setVertexEndCoords} from './maps.slice';
import mapStyles from './maps.styles';

const VertexDrag = () => {
  console.log('Rendering VertexDrag...');

  const dispatch = useDispatch();
  const vertexStartCoords = useSelector(state => state.map.vertexStartCoords);

  const selectedVertexOffset = 10;
  const vertexStartCoordsObj = {
    x: vertexStartCoords[0] - selectedVertexOffset,
    y: vertexStartCoords[1] - selectedVertexOffset,
  };
  const isPressed = useSharedValue(false);
  const offset = useSharedValue(vertexStartCoordsObj);
  const start = useSharedValue(vertexStartCoordsObj);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{translateX: offset.value.x}, {translateY: offset.value.y}],
      backgroundColor: isPressed.value ? 'yellow' : 'orange',
    };
  });

  const saveEnd = (endCoords) => {
    dispatch(setVertexEndCoords(endCoords));
  };

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

  return (
    <React.Fragment>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[mapStyles.vertexEditPoint, animatedStyles]} />
      </GestureDetector>
    </React.Fragment>
  );
};

export default VertexDrag;
