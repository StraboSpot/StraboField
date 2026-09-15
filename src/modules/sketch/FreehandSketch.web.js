import React, {useEffect, useRef} from 'react';

import {useDispatch} from 'react-redux';

import {ORANGE} from '../../shared/styles.constants';
import {setFreehandFeatureCoords} from '../maps/maps.slice';

const CANVAS_STYLE = {
  cursor: 'crosshair',
  height: '100%',
  left: 0,
  position: 'absolute',
  top: 0,
  touchAction: 'none',
  width: '100%',
};

let freehandFeatureCoords = [];

// True while a stroke is drawing; useMapDraw reads it to skip building a preview from a superseded stroke.
// Module flag, not state, so tracking it never re-renders mid-gesture.
let isDrawing = false;

export const getIsFreehandDrawing = () => isDrawing;

// Web has no native sketch canvas, so capture the stroke on a plain canvas overlaying the map. Points are
// kept in map-container coordinates, the space useMapDraw's mapRef.current.unproject() reads.
const FreehandSketch = ({mapMode}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  /* Local State */

  const canvasRef = useRef(null);

  /* Side Effects */

  useEffect(() => {
    isDrawing = false; // reset in case a prior gesture was interrupted before pointer up
    clear();
  }, [mapMode]);

  /* Event Handlers */

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId); // keep the stroke alive if the pointer leaves the map
    isDrawing = true;
    resetCanvas();
    freehandFeatureCoords = [getStrokePoint(e)];
  };

  const onPointerMove = (e) => {
    if (!isDrawing) return;
    const strokePoint = getStrokePoint(e);
    drawSegment(freehandFeatureCoords[freehandFeatureCoords.length - 1], strokePoint);
    freehandFeatureCoords.push(strokePoint);
  };

  const onPointerUp = () => {
    if (!isDrawing) return;
    isDrawing = false;
    dispatch(setFreehandFeatureCoords(freehandFeatureCoords));
    clear(); // the thinned preview drawn on the map replaces the raw stroke
  };

  /* Logic Helpers */

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0); // clearRect works in device pixels, undoing the pixel-ratio scale
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawSegment = ([fromX, fromY], [toX, toY]) => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.stroke();
  };

  const getStrokePoint = (e) => {
    const {left, top} = canvasRef.current.getBoundingClientRect();
    return [e.clientX - left, e.clientY - top];
  };

  // Size the backing store to the laid-out overlay, then restyle - resizing a canvas resets its context.
  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const {height, width} = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.height = height * pixelRatio;
    canvas.width = width * pixelRatio;
    const context = canvas.getContext('2d');
    context.scale(pixelRatio, pixelRatio); // so strokes are drawn in container coords but stay crisp on hidpi
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 3;
    context.strokeStyle = ORANGE;
  };

  /* View */

  return (
    <canvas
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      ref={canvasRef}
      style={CANVAS_STYLE}
    />
  );
};

export default FreehandSketch;