/**
 * Web zoom/pan for images: mouse-wheel zoom, double-click zoom, drag-to-pan.
 * Wheel/mouse aren't React Native props, so we attach non-passive DOM listeners
 * to the View's node via its ref.
 */
import React, {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_SPEED = 0.0015;
const DOUBLE_CLICK_STEP = 2; // Each double-click multiplies the scale by this.

const ImageZoomAndPanWrapper = ({children}) => {
  /* Local State */

  const containerRef = useRef(null);
  const dragStart = useRef(null);
  // Refs mirror state so the DOM listeners (bound once) always read fresh values.
  const scaleRef = useRef(1);
  const translateRef = useRef({x: 0, y: 0});

  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({x: 0, y: 0});

  /* Side Effects */

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.style.touchAction = 'none';

    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * ZOOM_SPEED * scaleRef.current;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current - delta));
      zoomToPoint(newScale, e.clientX, e.clientY, node);
    };

    // Double-click steps the zoom in towards the cursor, then resets once maxed.
    const onDoubleClick = (e) => {
      if (scaleRef.current >= MAX_SCALE) reset();
      else zoomToPoint(Math.min(MAX_SCALE, scaleRef.current * DOUBLE_CLICK_STEP), e.clientX, e.clientY, node);
    };

    const onMouseDown = (e) => {
      if (scaleRef.current <= MIN_SCALE) return;
      e.preventDefault();
      dragStart.current = {x: e.clientX - translateRef.current.x, y: e.clientY - translateRef.current.y};
      setIsDragging(true);
    };

    const onMouseMove = (e) => {
      if (!dragStart.current) return;
      const next = clampTranslate(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y, scaleRef.current, node);
      applyTranslate(next);
    };

    const endDrag = () => {
      if (!dragStart.current) return;
      dragStart.current = null;
      setIsDragging(false);
    };

    node.addEventListener('wheel', onWheel, {passive: false});
    node.addEventListener('dblclick', onDoubleClick);
    node.addEventListener('mousedown', onMouseDown);
    node.addEventListener('mousemove', onMouseMove);
    node.addEventListener('mouseup', endDrag);
    node.addEventListener('mouseleave', endDrag);

    return () => {
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('dblclick', onDoubleClick);
      node.removeEventListener('mousedown', onMouseDown);
      node.removeEventListener('mousemove', onMouseMove);
      node.removeEventListener('mouseup', endDrag);
      node.removeEventListener('mouseleave', endDrag);
    };
  }, []);

  /* Logic Helpers */

  const applyScale = (value) => {
    scaleRef.current = value;
    setScale(value);
  };

  const applyTranslate = (value) => {
    translateRef.current = value;
    setTranslate(value);
  };

  // Keep the panned image from drifting off-screen: max offset is half the
  // amount the scaled image overflows its container.
  const clampTranslate = (x, y, currentScale, node) => {
    const maxX = Math.max(0, (node.offsetWidth * currentScale - node.offsetWidth) / 2);
    const maxY = Math.max(0, (node.offsetHeight * currentScale - node.offsetHeight) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const reset = () => {
    applyScale(1);
    applyTranslate({x: 0, y: 0});
  };

  // Zoom to newScale while keeping the point under the cursor fixed on screen.
  const zoomToPoint = (newScale, clientX, clientY, node) => {
    const currentScale = scaleRef.current;
    if (newScale === currentScale) return;

    const rect = node.getBoundingClientRect();
    const cursorX = clientX - rect.left - rect.width / 2;
    const cursorY = clientY - rect.top - rect.height / 2;
    const {x, y} = translateRef.current;

    const nextX = cursorX - (newScale / currentScale) * (cursorX - x);
    const nextY = cursorY - (newScale / currentScale) * (cursorY - y);

    applyScale(newScale);
    applyTranslate(clampTranslate(nextX, nextY, newScale, node));
  };

  /* View */

  return (
    <View
      ref={containerRef}
      style={{
        cursor: scale > MIN_SCALE ? (isDragging ? 'grabbing' : 'grab') : 'default',
        overflow: 'hidden',
      }}
    >
      <View style={{transform: [{translateX: translate.x}, {translateY: translate.y}, {scale: scale}]}}>
        {children}
      </View>
    </View>
  );
};

export default ImageZoomAndPanWrapper;
