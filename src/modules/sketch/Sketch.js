import React, {useRef, useState} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';

import {SketchCanvas} from '@StraboSpot/react-native-sketch-canvas';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import {useToast} from 'react-native-toast-notifications';

import styles from './sketch.styles';
import {isEmpty} from '../../shared/helpers';
import {SMALL_SCREEN, SMALL_SCREEN_STATUS_BAR_OFFSET} from '../../shared/styles.constants';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import {useImages} from '../images';
import {getLocalImageURI} from '../images/imageURIs.helpers';

const ERASER_COLOR = '#00000000';
const MAX_STROKE_WIDTH = 10;
const MIN_STROKE_WIDTH = 1;
const STROKE_COLORS = [
  '#000000', '#FF0000', '#00FFFF', '#0000FF', '#0000A0', '#ADD8E6', '#800080', '#FFFF00', '#00FF00',
  '#FF00FF', '#FFFFFF', '#C0C0C0', '#808080', '#FFA500', '#A52A2A', '#800000', '#008000', '#808000',
];

const Sketch = ({image = {}, saveImages, saveUpdatedImage, setIsSketchModalVisible}) => {
  /* Data Hooks */

  const {saveFile, updateImage} = useImages();
  const toast = useToast();
  const {height, width} = useWindowSize();

  /* Local State */

  const sketchRef = useRef(null);
  const [color, setColor] = useState(STROKE_COLORS[0]);
  const [isOverwriteWarningVisible, setIsOverwriteWarningVisible] = useState(false);
  const [isSaveSketchModalVisible, setIsSaveSketchModalVisible] = useState(false);
  const [sketchPath, setSketchPath] = useState(null);
  const [strokeWidth, setStrokeWidth] = useState(MIN_STROKE_WIDTH);

  /* Derived Variables */

  // The sketch view fills the whole screen (toolbar pinned top, color palette pinned bottom), but the
  // drawing surface itself is sized to the source image's aspect ratio and centered — so only the
  // image can be drawn on, never the margins. Matching the image aspect ratio also keeps the exported
  // sketch's width/height in step with the stored dimensions the image basemap uses to place it (a
  // mismatch there stretches/compresses the basemap).
  const availableWidth = width;
  const availableHeight = height - 100 - (SMALL_SCREEN ? SMALL_SCREEN_STATUS_BAR_OFFSET : 0);
  // Vertical space reserved for the toolbar row (top) and color-palette row (bottom); see functionButton
  // (30 + 20*2) and strokeColorButton (50 + 20*2) in sketch.styles.js.
  const TOOLBAR_HEIGHT = 70;
  const PALETTE_HEIGHT = 90;
  const drawableWidth = availableWidth;
  const drawableHeight = availableHeight - TOOLBAR_HEIGHT - PALETTE_HEIGHT;
  let canvasWidth = drawableWidth;
  let canvasHeight = drawableHeight;
  if (image.width && image.height) {
    const imageAspect = image.width / image.height;
    if (drawableWidth / drawableHeight > imageAspect) canvasWidth = drawableHeight * imageAspect;
    else canvasHeight = drawableWidth / imageAspect;
  }

  /* Zoom & Pan (two fingers) */

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
    ],
  }));

  const clampTranslation = () => {
    'worklet';
    const maxTranslateX = Math.max(0, (canvasWidth * scale.value - canvasWidth) / 2);
    const maxTranslateY = Math.max(0, (canvasHeight * scale.value - canvasHeight) / 2);
    translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value));
    translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value));
  };

  // Two-finger gestures only, so a single finger is always free to draw. (The canvas itself ignores
  // multi-touch, so these never leave marks — see the patch to the sketch-canvas PanResponder.)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      clampTranslation();
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
      clampTranslation();
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  /* Event Handlers */

  const closeSaveSketchModal = () => {
    setIsOverwriteWarningVisible(false);
    setIsSaveSketchModalVisible(false);
  };

  const handleSaveSketchChoice = async (saveChoice) => {
    closeSaveSketchModal();
    await saveChoice(sketchPath);
  };

  const nextStrokeWidth = () => {
    setStrokeWidth(prev => (prev >= MAX_STROKE_WIDTH ? MIN_STROKE_WIDTH : prev + 1));
  };

  // Sketching over an existing image can either replace that image or be kept as a separate one
  const saveSketch = async (success, path) => {
    console.log(success, 'Path:', path);
    if (!success) {
      console.error('Error Saving Sketch');
      showSketchError();
    }
    else if (isEmpty(image)) await saveAsNewSketch(path);
    else {
      setSketchPath(path);
      setIsSaveSketchModalVisible(true);
    }
  };

  // Export at the source image's native pixel dimensions (cropToImageSize), so the saved sketch keeps
  // the same width/height the image basemap uses to place it.
  const onPressSave = () => {
    sketchRef.current?.save('jpg', false, 'RNSketchCanvas', String(Math.ceil(Math.random() * 100000000)),
      true, true, true);
  };

  /* Logic Helpers */

  // saveFile returns only id and dimensions, so title and type are carried over by hand. Sketching
  // over a photo leaves it a photo; only an untyped image becomes a sketch.
  const saveAsNewSketch = async (path) => {
    try {
      const savedFile = await saveFile({...image, 'path': path});
      const savedSketch = {
        ...savedFile,
        image_type: image.image_type || 'sketch',
        ...(!isEmpty(image.title) && {title: image.title}),
      };
      saveImages([savedSketch]);
      showSketchSaved();
    }
    catch (err) {
      console.error('Error Saving Sketch', err);
      showSketchError();
    }
  };

  // Leaves the sketch open so it can be saved again rather than losing it
  const showSketchError = () => toast.show('Error Saving Sketch', {type: 'danger'});

  const showSketchSaved = () => {
    toast.show('Sketch Saved!', {type: 'success', duration: 1500});
    setIsSketchModalVisible(false);
  };

  const updateSketch = async (path) => {
    try {
      const updatedImage = await updateImage({...image, image_type: image.image_type || 'sketch'}, path);
      saveUpdatedImage(updatedImage);
      showSketchSaved();
    }
    catch (err) {
      console.error('Error Updating Sketch', err);
      showSketchError();
    }
  };

  /* Render Functions */

  const renderColor = ({item}) => (
    <TouchableOpacity onPress={() => setColor(item)} style={{marginHorizontal: 2.5}}>
      <View style={[{backgroundColor: item}, styles.strokeColorButton, color === item && {borderWidth: 2}]}/>
    </TouchableOpacity>
  );

  // Updating replaces the image file in place, so it takes a second, deliberate tap to confirm. Shown
  // in place of the choices rather than in its own modal, since a modal opened while another dismisses
  // is dropped on iOS.
  const renderOverwriteWarning = () => (
    <View style={overlayStyles.overlayContent}>
      <Text style={[overlayStyles.contentText, styles.warningText]}>
        Updating will overwrite the existing image. This cannot be undone.
      </Text>
      <ActionButton
        onPress={() => handleSaveSketchChoice(updateSketch)}
        title={'  Update Existing  '}
      />
      <OutlineButton
        onPress={() => setIsOverwriteWarningVisible(false)}
        title={'      Cancel      '}
      />
    </View>
  );

  const renderSaveSketchChoices = () => (
    <View style={overlayStyles.overlayContent}>
      <Text style={overlayStyles.contentText}>
        Save this sketch as a copy or update the existing image?
      </Text>
      <ActionButton
        onPress={() => handleSaveSketchChoice(saveAsNewSketch)}
        title={'  Save as Copy  '}
      />
      <OutlineButton
        onPress={() => setIsOverwriteWarningVisible(true)}
        title={'Update Existing'}
      />
    </View>
  );

  // Rendered as a view rather than a modal since it is already inside the fullscreen sketch modal
  const renderSaveSketchModal = () => (
    <ModalWrapper
      closeModal={closeSaveSketchModal}
      doesRenderAsView
      headerTitle={isOverwriteWarningVisible ? 'Warning!' : 'Save Sketch'}
      overlayStyleOverride={{maxHeight: '35%'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      {isOverwriteWarningVisible ? renderOverwriteWarning() : renderSaveSketchChoices()}
    </ModalWrapper>
  );

  /* View */

  return (
    <View style={[styles.container, {flex: 1}]}>
      <View style={{width: availableWidth, height: availableHeight}}>
        {/* Toolbar */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={() => sketchRef.current?.clear()}>
              <View style={{...styles.functionButton, backgroundColor: 'red'}}>
                <Text style={{color: 'white'}}>Clear</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setColor(ERASER_COLOR)}>
              <View style={[styles.functionButton, color === ERASER_COLOR && {borderColor: 'white', borderWidth: 2}]}>
                <Text style={{color: 'white'}}>Eraser</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={nextStrokeWidth}>
              <View style={styles.strokeWidthButton}>
                <View style={{
                  backgroundColor: 'white', marginHorizontal: 2.5,
                  width: Math.sqrt(strokeWidth / 3) * 10, height: Math.sqrt(strokeWidth / 3) * 10,
                  borderRadius: Math.sqrt(strokeWidth / 3) * 10 / 2,
                }}/>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sketchRef.current?.undo()}>
              <View style={styles.functionButton}><Text style={{color: 'white'}}>Undo</Text></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onPressSave}>
              <View style={styles.functionButton}><Text style={{color: 'white'}}>Save</Text></View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Drawing surface (one finger draws, two fingers zoom/pan, double-tap resets) */}
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              collapsable={false}
              style={[{width: canvasWidth, height: canvasHeight}, animatedStyle]}
            >
              <SketchCanvas
                localSourceImage={{
                  filename: getLocalImageURI(image.id).replace('file://', ''),
                  mode: 'AspectFit',
                }}
                onSketchSaved={saveSketch}
                ref={sketchRef}
                strokeColor={color}
                strokeWidth={strokeWidth}
                style={{backgroundColor: 'transparent', flex: 1}}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Color palette */}
        <View style={{flexDirection: 'row'}}>
          <FlatList
            data={STROKE_COLORS}
            horizontal
            keyExtractor={item => item}
            renderItem={renderColor}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Modal */}
      {isSaveSketchModalVisible && renderSaveSketchModal()}
    </View>
  );
};

export default Sketch;
