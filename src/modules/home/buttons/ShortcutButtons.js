import React, {useEffect, useState} from 'react';
import {Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import DismissibleWarningModal from '../../../shared/ui/modals/DismissibleWarningModal';
import {useImages} from '../../images';
import useMapLocation from '../../maps/view/useMapLocation';
import {SHORTCUT_MODALS} from '../../page/page.constants';
import {MODAL_KEYS} from '../../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../../project/projects.slice';
import SketchModal from '../../sketch/SketchModal';
import {clearedSelectedSpots, editedSpotImages} from '../../spots/spots.slice';
import {DISMISSIBLE_WARNING_MESSAGES, DISMISSIBLE_WARNINGS} from '../home.constants';
import {setLoadingStatus, setModalVisible, setShortcutSwitchPositions} from '../home.slice';

const ShortcutButtons = ({openNotebookPanel}) => {
  console.log('Rendering ShortcutButtons...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const isCameraOrientationWarningHidden = useSelector(
    state => state.home.hiddenWarnings[DISMISSIBLE_WARNINGS.CAMERA_ORIENTATION]);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const shortcutSwitchPositions = useSelector(state => state.home.shortcutSwitchPosition);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {launchCameraFromNotebook} = useImages();
  const {setPointAtCurrentLocation} = useMapLocation();
  const toast = useToast();

  /* Local State */

  const [isOrientationWarningVisible, setIsOrientationWarningVisible] = useState(false);
  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);

  /* Derived Variables */

  const isTargetDatasetMissing = isEmpty(targetDatasetId);

  /* Side Effects */

  useEffect(() => {
    if (!isTargetDatasetMissing) return;
    if (Object.values(shortcutSwitchPositions).some(Boolean)) {
      dispatch(setShortcutSwitchPositions({switchName: 'all', value: false}));
    }
  }, [dispatch, isTargetDatasetMissing, shortcutSwitchPositions]);

  /* Event Handlers */

  const handleOrientationWarningContinue = () => {
    setIsOrientationWarningVisible(false);
    capturePhotoAtCurrentLocation();
  };

  /* Logic Helpers */

  const capturePhotoAtCurrentLocation = async () => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
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
      }
      if (!SMALL_SCREEN) openNotebookPanel();
    }
    dispatch(setLoadingStatus({view: 'home', bool: false}));
  };

  const saveImagesToSpot = (newImages) => {
    dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot?.properties?.id]));
    dispatch(editedSpotImages(newImages));
    toast.show(`${newImages.length} image(s) saved!`, {type: 'success', duration: 1500});
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
        const point = await setPointAtCurrentLocation();
        if (point) setIsSketchModalVisible(true);
        if (!SMALL_SCREEN) openNotebookPanel();
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
        if (!isTargetDatasetMissing && shortcutSwitchPositions[sm.key] && (Platform.OS !== 'web' || (Platform.OS === 'web'
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
        <SketchModal saveImages={saveImagesToSpot} setIsSketchModalVisible={setIsSketchModalVisible}/>
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
