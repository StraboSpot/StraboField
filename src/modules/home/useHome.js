import {useEffect, useState} from 'react';
import {Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector, useStore} from 'react-redux';

import {setIsOfflineMapsModalVisible, setLoadingStatus} from './home.slice';
import useDeviceOrientation from './useDeviceOrientation';
import useAutoSave from '../../services/files/useAutoSave';
import {isEmpty} from '../../shared/helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import {MAP_MODES} from '../maps/maps.constants';
import {
  cancelledIntervalDrag,
  clearedStratSection,
  savedIntervalDragReordering,
  setFreehandFeatureCoords,
  setIsScaleBarMetric,
  startedIntervalDrag,
} from '../maps/maps.slice';
import useMapLocation from '../maps/view/useMapLocation';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import useProject from '../project/useProject';
import {useSpots} from '../spots';
import {
  clearedSelectedSpots,
  editedOrCreatedSpots,
  restoredIntervalDragSnapshot,
  setIntersectedSpotsForTagging,
} from '../spots/spots.slice';

const useHome = ({closeMainMenuPanel, mapComponentRef, openNotebookPanel, zoomToCurrentLocation}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const intervalDragSnapshot = useSelector(state => state.map.intervalDragSnapshot);
  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const isOfflineMapModalVisible = useSelector(state => state.home.isOfflineMapModalVisible);
  const isScaleBarMetric = useSelector(state => state.map.isScaleBarMetric);
  const stratSection = useSelector(state => state.map.stratSection);

  const store = useStore();

  const {lockOrientation, unlockOrientation} = useDeviceOrientation();
  const {setPointAtCurrentLocation} = useMapLocation();
  const {getTargetDatasetFromId} = useProject();
  const {getRootSpot, getSpotWithThisStratSection, handleSpotSelected} = useSpots();
  const toast = useToast();
  useAutoSave();

  /* Local State */

  const [dialogs, setDialogs] = useState(
    {mapActionsMenuVisible: false, mapSymbolsMenuVisible: false, baseMapMenuVisible: false});
  const [distance, setDistance] = useState(0);
  const [mapMode, setMapMode] = useState(MAP_MODES.VIEW);
  const [selectingMode, setSelectingMode] = useState(null);

  /* Derived Variables */

  const isEditingOrDrawing = mapMode === MAP_MODES.EDIT || Object.values(MAP_MODES.DRAW).includes(mapMode);

  /* Side Effects */

  useEffect(() => {
    // console.log('UE Home [mapMode]', mapMode);
    if (mapMode !== MAP_MODES.DRAW.MEASURE) mapComponentRef.current?.endMapMeasurement();
  }, [mapMode]);

  // Switching to an image basemap or strat section leaves the current map, so cancel any in-progress
  // editing or drawing (those changes belong to the map you were on).
  useEffect(() => {
    if (isEditingOrDrawing) onCancel();
  }, [currentImageBasemap, stratSection]);

  useEffect(() => {
    if (!isDragIntervalMode && mapMode === MAP_MODES.INTERVAL_DRAG) setMapMode(MAP_MODES.VIEW);
  }, [isDragIntervalMode]);

  /* Internal Functions */

  const cancelEdits = async () => {
    await mapComponentRef.current?.cancelEdits();
    setMapMode(MAP_MODES.VIEW);
    if (!SMALL_SCREEN) unlockOrientation();
  };

  const createPointAtCurrentLocation = async () => {
    try {
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      await setPointAtCurrentLocation();
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      toast.show(`Point Spot Added at Current\n Location to Dataset ${getTargetDatasetFromId().name.toUpperCase()}`,
        {type: 'success'});
      openNotebookPanel();
    }
    catch (err) {
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      console.error('Error setting point to current location', err);
    }
  };

  const saveEdits = async () => {
    mapComponentRef.current?.saveEdits();
    //cancelEdits();
    setMapMode(MAP_MODES.VIEW);
    if (!SMALL_SCREEN) unlockOrientation();
  };

  const setDraw = async (mapModeToSet) => {
    mapComponentRef.current?.cancelDraw();
    if (mapMode === mapModeToSet
      || (mapMode === MAP_MODES.DRAW.FREEHANDPOLYGON && mapModeToSet === MAP_MODES.DRAW.POLYGON)
      || (mapMode === MAP_MODES.DRAW.FREEHANDLINE && mapModeToSet === MAP_MODES.DRAW.LINE)
    ) mapModeToSet = MAP_MODES.VIEW;
    setMapMode(mapModeToSet);
  };

  /* Exported Functions */

  const clickHandler = async (name, value) => {
    if (name !== 'startIntervalDrag' && name !== 'saveReordering' && name !== 'cancelIntervalDrag') {
      if (isDragIntervalMode) setMapMode(MAP_MODES.VIEW);
      dispatch(cancelledIntervalDrag());
    }
    switch (name) {
      // Map Actions
      case MAP_MODES.DRAW.POINT:
      case MAP_MODES.DRAW.LINE:
      case MAP_MODES.DRAW.POLYGON:
      case MAP_MODES.DRAW.FREEHANDPOLYGON:
      case MAP_MODES.DRAW.FREEHANDLINE:
      case MAP_MODES.DRAW.POINTLOCATION:
        setSelectingMode(null);
        dispatch(clearedSelectedSpots());
        const targetDataset = getTargetDatasetFromId();
        if (!isEmpty(targetDataset) && name === MAP_MODES.DRAW.POINTLOCATION) await createPointAtCurrentLocation();
        else if (!isEmpty(targetDataset)) setDraw(name).catch(console.error);
        else toast.show('No Current Dataset! \n A current dataset needs to be set before drawing Spots.');
        break;
      case 'cancelEdits':
        await cancelEdits();
        break;
      case 'saveEdits':
        await saveEdits();
        break;
      case 'startEditing':
        mapComponentRef.current?.startEditingMode();
        break;
      case 'toggleUserLocation':
        if (value) zoomToCurrentLocation().catch(console.error);
        mapComponentRef.current?.toggleUserLocation(value);
        break;
      case 'closeImageBasemap':
        const spotWithThisImageBasemap = getRootSpot(currentImageBasemap?.id);
        handleSpotSelected(spotWithThisImageBasemap);
        break;
      case 'closeStratSection':
        const spotWithThisStratSection = getSpotWithThisStratSection(stratSection?.strat_section_id);
        // If the strat section has been deleted there is no spot to select, so clear it directly to close the view
        if (spotWithThisStratSection) handleSpotSelected(spotWithThisStratSection);
        else dispatch(clearedStratSection());
        break;
      // Map Actions
      case 'zoom':
        mapComponentRef.current?.zoomToSpotsExtent();
        break;
      case 'saveMap':
        dispatch(setIsOfflineMapsModalVisible(!isOfflineMapModalVisible));
        closeMainMenuPanel();
        break;
      case 'addTag':
        dispatch(setIntersectedSpotsForTagging([]));
        // console.log(`${name}`, ' was clicked');
        mapComponentRef.current?.clearSelectedSpots();
        setSelectingMode('tag');
        setDraw(MAP_MODES.DRAW.FREEHANDPOLYGON).catch(console.error);
        break;
      case 'addToReport':
        dispatch(setIntersectedSpotsForTagging([]));
        mapComponentRef.current?.clearSelectedSpots();
        setSelectingMode('report');
        setDraw(MAP_MODES.DRAW.FREEHANDPOLYGON).catch(console.error);
        break;
      case 'stereonet':
        mapComponentRef.current?.clearSelectedSpots();
        setSelectingMode('stereonet');
        setDraw(MAP_MODES.DRAW.FREEHANDPOLYGON).catch(console.error);
        break;
      case 'selectSpots':
        mapComponentRef.current?.clearSelectedSpots();
        setSelectingMode('selectSpots');
        setDraw(MAP_MODES.DRAW.FREEHANDPOLYGON).catch(console.error);
        break;
      case 'mapMeasurement':
        setDraw(MAP_MODES.DRAW.MEASURE).catch(console.error);
        break;
      case 'stratSection':
        const selectedSpotWithThisStratSection = getSpotWithThisStratSection(stratSection?.strat_section_id);
        handleSpotSelected(selectedSpotWithThisStratSection);
        openNotebookPanel(PAGE_KEYS.STRAT_SECTION);
        break;
      case 'toggleScaleBarUnits':
        dispatch(setIsScaleBarMetric(!isScaleBarMetric));
        break;
      case 'startIntervalDrag':
        dispatch(startedIntervalDrag(
          Object.values(store.getState().spot.spots)
            .filter(s => s.properties.strat_section_id === stratSection?.strat_section_id)
            .map(s => JSON.parse(JSON.stringify(s))),
        ));
        setMapMode(MAP_MODES.INTERVAL_DRAG);
        break;
      case 'saveReordering':
        // Commit the deferred timestamp bump for spots actually moved during the drag, so only a
        // real reorder dirties the dataset/project. Nothing moved → nothing to bump.
        const changedSpotIds = store.getState().map.intervalDragChangedSpotIds;
        if (changedSpotIds?.length > 0) dispatch(updatedModifiedTimestampsBySpotsIds(changedSpotIds));
        dispatch(savedIntervalDragReordering());
        setMapMode(MAP_MODES.VIEW);
        break;
      case 'cancelIntervalDrag':
        if (intervalDragSnapshot?.length > 0) {
          dispatch(restoredIntervalDragSnapshot(intervalDragSnapshot));
          if (Platform.OS !== 'web') dispatch(editedOrCreatedSpots(intervalDragSnapshot));
        }
        dispatch(cancelledIntervalDrag());
        setMapMode(MAP_MODES.VIEW);
        break;
    }
  };

  const dialogClickHandler = (dialog, name, position) => {
    clickHandler(name, position);
    toggleDialog(dialog);
  };

  const endMeasurement = () => setMapMode(MAP_MODES.VIEW);

  const onCancel = async () => {
    console.log('Cancel');
    await cancelEdits();
    dispatch(setFreehandFeatureCoords(undefined));  // reset the freeHandCoordinates
  };

  const onEndDrawPressed = async () => {
    try {
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      const newOrEditedSpot = await mapComponentRef.current?.endDraw();
      setMapMode(MAP_MODES.VIEW);
      if (!isEmpty(newOrEditedSpot) && (!selectingMode || selectingMode === 'tag')) {
        openNotebookPanel(PAGE_KEYS.OVERVIEW);
      }
      setSelectingMode(null);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
    catch (err) {
      console.error('Error at endDraw', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
  };

  const setMapModeToEdit = () => {
    if (!SMALL_SCREEN) lockOrientation();
    setMapMode(MAP_MODES.EDIT);
  };

  // Toggle given dialog between true (visible) and false (hidden)
  const toggleDialog = (dialog) => {
    dispatch(cancelledIntervalDrag());
    console.log('Toggle', dialog);
    setDialogs({
      ...dialogs,
      [dialog]: !dialogs[dialog],
    });
    console.log(dialog, 'is set to', dialogs[dialog]);
  };

  return {
    clickHandler,
    dialogClickHandler,
    dialogs,
    distance,
    endMeasurement,
    mapMode,
    onCancel,
    onEndDrawPressed,
    selectingMode,
    setDistance,
    setMapModeToEdit,
    toggleDialog,
  };
};

export default useHome;
