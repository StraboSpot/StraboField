import React, {useRef, useState} from 'react';
import {Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import IconButton from '../../../shared/ui/buttons/IconButton';
import DismissibleWarningModal from '../../../shared/ui/modals/DismissibleWarningModal';
import useImages from '../../images/useImages';
import useMapLocation from '../../maps/view/useMapLocation';
import {SHORTCUT_MODALS} from '../../page/page.constants';
import {MODAL_KEYS, PAGE_KEYS} from '../../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../../project/projects.slice';
import SketchModal from '../../sketch/SketchModal';
import {clearedSelectedSpots, editedSpotImages} from '../../spots/spots.slice';
import useSpots from '../../spots/useSpots';
import {DISMISSIBLE_WARNING_MESSAGES, DISMISSIBLE_WARNINGS} from '../home.constants';
import {setLoadingStatus, setModalVisible} from '../home.slice';
import useShortcutSwitches from '../useShortcutSwitches';

const ShortcutButtons = ({openNotebookPanel}) => {
  console.log('Rendering ShortcutButtons...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const isCameraOrientationWarningHidden = useSelector(
    state => state.home.hiddenWarnings[DISMISSIBLE_WARNINGS.CAMERA_ORIENTATION]);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const selectedSpot = useSelector(state => state.spot.selectedSpot);


  const {launchCameraFromNotebook} = useImages();
  const {setPointAtCurrentLocation} = useMapLocation();
  const {discardSpot} = useSpots();
  const {isTargetDatasetMissing, shortcutSwitchPositions} = useShortcutSwitches();
  const toast = useToast();

  /* Local State */

  const [isOrientationWarningVisible, setIsOrientationWarningVisible] = useState(false);
  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);

  // The Spot the sketch shortcut makes up front, and the Spot number it took, held until the sketch is either
  // saved or abandoned. Its location has to be taken before the canvas opens, since asking for it on save could
  // lose a finished sketch to a GPS failure.
  const pendingSketchSpotRef = useRef(null);

  /* Event Handlers */

  const handleOrientationWarningContinue = () => {
    setIsOrientationWarningVisible(false);
    capturePhotoAtCurrentLocation();
  };

  // Sketch closes itself on both save and cancel, so this is the one place the two can be told apart: a Spot
  // still pending here was never drawn into.
  const handleSketchModalVisibleChange = (isVisible) => {
    setIsSketchModalVisible(isVisible);
    if (isVisible || !pendingSketchSpotRef.current) return;
    const {spot, spotNumber} = pendingSketchSpotRef.current;
    pendingSketchSpotRef.current = null;
    discardSpot(spot, spotNumber);
  };

  /* Logic Helpers */

  const capturePhotoAtCurrentLocation = async () => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    const spotNumberBeforeCreate = preferences.starting_number_for_spot;
    const point = await setPointAtCurrentLocation();
    if (point) {
      const newImages = await launchCameraFromNotebook();
      const imagesSavedLength = newImages.length;
      if (imagesSavedLength > 0) {
        dispatch(updatedModifiedTimestampsBySpotsIds([point.properties.id]));
        dispatch(editedSpotImages(newImages));
        toast.show(
          imagesSavedLength + ' photo' + (imagesSavedLength === 1 ? '' : 's') + ' saved in new Spot '
          + point.properties.name, {type: 'success'},
        );
        openNotebookPanel(PAGE_KEYS.IMAGES);
      }
      // Backing out of the camera would otherwise leave an empty Spot at the user's feet
      else discardSpot(point, spotNumberBeforeCreate);
    }
    dispatch(setLoadingStatus({view: 'home', bool: false}));
  };

  // Sketch reports its save through here, so the Spot made for it is earned and no longer pending. Sketch says
  // 'Sketch Saved!' itself, so there is no toast here - two for the one save read as a glitch.
  const saveImagesToSpot = (newImages) => {
    pendingSketchSpotRef.current = null;
    dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot?.properties?.id]));
    dispatch(editedSpotImages(newImages));
    openNotebookPanel(PAGE_KEYS.IMAGES);
  };

  const toggleShortcutModal = async (key) => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    dispatch(clearedSelectedSpots());
    switch (key) {
      case 'photo': {
        if (isCameraOrientationWarningHidden) await capturePhotoAtCurrentLocation();
        else setIsOrientationWarningVisible(true);
        break;
      }
      case 'sketch': {
        const spotNumberBeforeCreate = preferences.starting_number_for_spot;
        const point = await setPointAtCurrentLocation();
        if (point) {
          pendingSketchSpotRef.current = {spot: point, spotNumber: spotNumberBeforeCreate};
          setIsSketchModalVisible(true);
        }
        break;
      }
      default:
        if (modalVisible === key) dispatch(setModalVisible({modal: null}));
        else dispatch(setModalVisible({modal: key}));
    }
    dispatch(setLoadingStatus({view: 'home', bool: false}));
  };

  /* View */

  return (
    <>
      {SHORTCUT_MODALS?.reduce((acc, sm) => {
        if (!isTargetDatasetMissing && shortcutSwitchPositions[sm.key]
          && (Platform.OS !== 'web'
            || (Platform.OS === 'web'
              && sm.key !== MODAL_KEYS.SHORTCUTS.PHOTO && sm.key !== MODAL_KEYS.SHORTCUTS.SKETCH))) {
          return [...acc, (
            <IconButton
              key={sm.key}
              onPress={() => toggleShortcutModal(sm.key)}
              source={modalVisible === sm.key ? sm.icon_pressed_src : sm.icon_src}
            />
          )];
        }
        else return acc;
      }, [])}

      {/* Modals */}
      {isSketchModalVisible && (
        <SketchModal saveImages={saveImagesToSpot} setIsSketchModalVisible={handleSketchModalVisibleChange}/>
      )}
      <DismissibleWarningModal
        headerTitle={'Camera Orientation'}
        isVisible={isOrientationWarningVisible}
        message={DISMISSIBLE_WARNING_MESSAGES[DISMISSIBLE_WARNINGS.CAMERA_ORIENTATION]}
        onCancel={() => setIsOrientationWarningVisible(false)}
        onContinue={handleOrientationWarningContinue}
        warningKey={DISMISSIBLE_WARNINGS.CAMERA_ORIENTATION}
      />
    </>
  );
};

export default ShortcutButtons;
