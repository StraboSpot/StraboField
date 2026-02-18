import React, {useState} from 'react';
import {Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {useImages} from '../../images';
import useMapLocation from '../../maps/useMapLocation';
import {SHORTCUT_MODALS} from '../../page/page.constants';
import {MODAL_KEYS} from '../../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../../project/projects.slice';
import SketchModal from '../../sketch/SketchModal';
import {clearedSelectedSpots, editedSpotImages} from '../../spots/spots.slice';
import {setLoadingStatus, setModalVisible} from '../home.slice';

const ShortcutButtons = ({openNotebookPanel}) => {
  console.log('Rendering ShortcutButtons...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const shortcutSwitchPositions = useSelector(state => state.home.shortcutSwitchPosition);

  const {launchCameraFromNotebook} = useImages();
  const {setPointAtCurrentLocation} = useMapLocation();
  const toast = useToast();

  /* Local State */

  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);

  /* Logic Helpers */

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
        if (shortcutSwitchPositions[sm.key] && (Platform.OS !== 'web' || (Platform.OS === 'web'
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
      {isSketchModalVisible && (
        <SketchModal saveImages={saveImagesToSpot} setIsSketchModalVisible={setIsSketchModalVisible}/>
      )}
    </>
  );
};

export default ShortcutButtons;
