import React, {useEffect, useRef} from 'react';
import {View} from 'react-native';

import RNSketchCanvas from '@StraboSpot/react-native-sketch-canvas';
import {useDispatch} from 'react-redux';

import {useWindowSize} from '../../shared/ui/useWindowSize';
import useDeviceOrientation from '../home/useDeviceOrientation';
import {setFreehandFeatureCoords} from '../maps/maps.slice';

let freehandFeatureCoords = [];

const FreehandSketch = ({mapMode}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {lockOrientation, unlockOrientation} = useDeviceOrientation();
  const {height, width} = useWindowSize();

  /* Local State */

  const freehandDrawRef = useRef(null);

  /* Side Effects */

  useEffect(() => {
    lockOrientation();
    return () => unlockOrientation();
  }, []);

  useEffect(() => {
    clear();
  }, [mapMode]);

  /* Event Handlers */

  const onStrokeChanged = (x, y) => freehandFeatureCoords.push([x, y]);

  const onStrokeEnd = () => dispatch(setFreehandFeatureCoords(freehandFeatureCoords));

  const onStrokeStart = () => {
    if (freehandFeatureCoords.length > 1) clear();
    freehandFeatureCoords = [];
  };

  /* Logic Helpers */

  const clear = () => freehandDrawRef.current.clear();

  /* View */

  return (
    <View style={{position: 'absolute', width: width, height: height}}>
      <RNSketchCanvas
        canvasStyle={{backgroundColor: 'transparent', flex: 1}}
        containerStyle={{backgroundColor: 'transparent', flex: 1}}
        defaultStrokeIndex={13} // Orange
        defaultStrokeWidth={3}
        onStrokeChanged={onStrokeChanged}
        onStrokeEnd={onStrokeEnd}
        onStrokeStart={onStrokeStart}
        ref={freehandDrawRef}
      />
    </View>
  );
};

export default FreehandSketch;
