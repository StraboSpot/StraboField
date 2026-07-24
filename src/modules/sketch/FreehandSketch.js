import React, {useEffect, useRef} from 'react';
import {View} from 'react-native';

import RNSketchCanvas from '@StraboSpot/react-native-sketch-canvas';
import {useDispatch} from 'react-redux';

import {SMALL_SCREEN} from '../../shared/styles.constants';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import useDeviceOrientation from '../home/useDeviceOrientation';
import {setFreehandFeatureCoords} from '../maps/maps.slice';

let freehandFeatureCoords = [];

// True while a stroke is drawing; useMapFeaturesDraw reads it to defer the preview's map re-render until lift,
// since any re-render mid-gesture truncates the stroke. Module flag, not state, for that same reason.
let isDrawing = false;

export const getIsFreehandDrawing = () => isDrawing;

const FreehandSketch = ({mapMode}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {lockOrientation, unlockOrientation} = useDeviceOrientation();
  const {height, width} = useWindowSize();

  /* Local State */

  const freehandDrawRef = useRef(null);

  /* Side Effects */

  useEffect(() => {
    if (SMALL_SCREEN) return;
    lockOrientation();
    return () => unlockOrientation();
  }, []);

  useEffect(() => {
    isDrawing = false; // reset in case a prior gesture was interrupted before onStrokeEnd
    clear();
  }, [mapMode]);

  /* Event Handlers */

  const onStrokeChanged = (x, y) => freehandFeatureCoords.push([x, y]);

  const onStrokeEnd = () => {
    isDrawing = false;
    dispatch(setFreehandFeatureCoords(freehandFeatureCoords));
    setTimeout(clear, 0); // clear the raw stroke so strokes don't stack; deferred so the library's endPath runs first
  };

  const onStrokeStart = () => {
    // Never clear() or dispatch mid-gesture — both truncate the stroke; isDrawing lets a late preview build bail.
    isDrawing = true;
    freehandFeatureCoords = [];
  };

  /* Logic Helpers */

  const clear = () => freehandDrawRef.current?.clear();

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
