import {useState} from 'react';
import {PixelRatio, Platform} from 'react-native';

import * as turf from '@turf/turf';
import {useDispatch, useSelector, useStore} from 'react-redux';

import {MAP_MODES} from './maps.constants';
import {convertImagePixelsToLatLong} from './maps.helpers';
import {setIntervalDragState} from './maps.slice';
import useMap from './useMap';
import useMapFeatures from './useMapFeatures';
import useMapFeaturesCalculated from './useMapFeaturesCalculated';
import useMapMeasure from './useMapMeasure';
import {isEmpty} from '../../shared/Helpers';
import {useSpots} from '../spots';
import {setSelectedSpot} from '../spots/spots.slice';

const useMapPressEvents = ({
                             clearSelectedSpots,
                             editSpot,
                             getSpotToEdit,
                             mapMode,
                             mapRef,
                             measureFeatures,
                             setDistance,
                             setDrawFeaturesNew,
                             setIsShowMacrostratOverlay,
                             setMapModeToEdit,
                             setMeasureFeatures,
                             switchToEditing,
                           }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const stratSection = useSelector(state => state.map.stratSection);

  const {isDrawMode} = useMap();
  const {getAllMappedSpots} = useMapFeatures();
  const {getSpotAtPress} = useMapFeaturesCalculated(mapRef);
  const {getMeasureFeatures} = useMapMeasure(mapRef);
  const {getSpotWithThisStratSection} = useSpots();
  const store = useStore();

  /* Local State */

  const [location, setLocation] = useState({coords: [0, 0], zoom: 16});

  /* Internal Functions */

  const getScreenPoint = (e) => {
    if (Platform.OS === 'web') return [e.point.x, e.point.y];
    if (Platform.OS === 'android') {
      return [e.properties.screenPointX / PixelRatio.get(), e.properties.screenPointY / PixelRatio.get()];
    }
    return [e.properties.screenPointX, e.properties.screenPointY];
  };

  /* Exported Functions */

  // Handle a long press on the map by making the point or vertex at the point "selected"
  const handleMapLongPress = async (e) => {
    console.log('Map long press detected:', e);
    const [screenPointX, screenPointY] = getScreenPoint(e);
    const spotToEdit = await getSpotAtPress(screenPointX, screenPointY);

    const mappedSpots = getAllMappedSpots();
    if (mapMode === MAP_MODES.VIEW && !isEmpty(mappedSpots) && !isEmpty(spotToEdit)) {
      await switchToEditing(screenPointX, screenPointY, spotToEdit, setMapModeToEdit);
    }
    else if (mapMode === MAP_MODES.EDIT) await getSpotToEdit(e, screenPointX, screenPointY, spotToEdit);
    else console.log('No Spots to edit. No action taken.');
  };

  // Mapbox: Handle map press
  const handleMapPress = async (e) => {
    if (isDragIntervalMode && stratSection && mapMode === MAP_MODES.INTERVAL_DRAG) {
      const [x, y] = getScreenPoint(e);
      const clientY = Platform.OS === 'web' ? (e.originalEvent?.clientY ?? y) : y;
      const spotAtPress = await getSpotAtPress(x, y);
      const isStratInterval = s => s?.properties?.surface_feature?.surface_feature_type === 'strat_interval';
      // Fall back to the previously selected interval (e.g. click fired after snap-line drag
      // lands on a slot boundary where queryRenderedFeatures finds no feature).
      // Read selectedSpot from store directly to get the post-reorder value on web.
      const freshSelectedSpot = store.getState().spot.selectedSpot;
      const intervalToUse = isStratInterval(spotAtPress) ? spotAtPress
        : isStratInterval(freshSelectedSpot) ? freshSelectedSpot
          : null;
      if (intervalToUse) await startIntervalDrag(x, y, intervalToUse, clientY);
      return;
    }

    if (store.getState().map.intervalDragState) return;

    console.log('Map press detected:', e);
    console.log('Map mode:', mapMode);
    if (mapMode === MAP_MODES.DRAW.MEASURE) {
      const updatedMeasureFeatures = await getMeasureFeatures(e, [...measureFeatures], setDistance);
      setMeasureFeatures(updatedMeasureFeatures);
    }
    else if (mapMode !== MAP_MODES.DRAW.FREEHANDPOLYGON && mapMode !== MAP_MODES.DRAW.FREEHANDLINE) {
      // Select/Unselect a feature
      if (mapMode === MAP_MODES.VIEW) {
        console.log('Selecting or unselect a feature ...');
        const [screenPointX, screenPointY] = getScreenPoint(e);
        const spotFound = await getSpotAtPress(screenPointX, screenPointY);
        if (currentBasemap?.source === 'macrostrat' && !stratSection && !currentImageBasemap) {
          setIsShowMacrostratOverlay(true);
          const currentZoom = await mapRef.current.getZoom();
          setLocation(
            {coords: (Platform.OS !== 'web' ? e.geometry?.coordinates : Object.values(e.lngLat)), zoom: currentZoom});
        }
        if (!isEmpty(spotFound)) dispatch(setSelectedSpot(spotFound));
        else if (stratSection) {
          dispatch(setSelectedSpot(getSpotWithThisStratSection(stratSection.strat_section_id)));
        }
        else clearSelectedSpots();
      }
      // Draw a feature
      else if (isDrawMode(mapMode)) setDrawFeaturesNew(e);
      // Edit a Spot
      else if (mapMode === MAP_MODES.EDIT) await editSpot(e);
      else console.log('Error. Unknown map mode:', mapMode);
    }
  };

  const startIntervalDrag = async (screenPointX, screenPointY, draggedInterval, startClientY) => {
    const isCore = stratSection.section_type === 'core';
    // Read directly from store so post-reorder calls get fresh positions, not stale selector values
    const freshSpots = store.getState().spot.spots;
    const intervals = Object.values(freshSpots).filter(s =>
      s.properties.strat_section_id === stratSection.strat_section_id
      && s.properties.surface_feature?.surface_feature_type === 'strat_interval',
    );
    const sorted = [...intervals].sort((a, b) => {
      const extA = turf.bbox(a);
      const extB = turf.bbox(b);
      return isCore ? extB[3] - extA[3] : extA[1] - extB[1];
    });

    const targetInterval = draggedInterval
      ? (sorted.find(s => s.properties.id === draggedInterval.properties.id) ?? sorted[0])
      : sorted[0];
    if (!targetInterval) return;

    dispatch(setSelectedSpot(targetInterval));

    const slotMap = [];
    for (let i = 0; i <= sorted.length; i++) {
      let boundaryCoord;
      if (i === 0) {
        const firstExt = turf.bbox(sorted[0]);
        boundaryCoord = isCore ? [0, firstExt[3]] : [0, firstExt[1]];
      }
      else {
        const ext = turf.bbox(sorted[i - 1]);
        boundaryCoord = isCore ? [0, ext[1]] : [0, ext[3]];
      }
      let screenY;
      let lngLat;
      try {
        const mapCoord = {type: 'Feature', geometry: {type: 'Point', coordinates: boundaryCoord}};
        const latLngFeature = convertImagePixelsToLatLong(JSON.parse(JSON.stringify(mapCoord)));
        lngLat = latLngFeature.geometry.coordinates;
        if (Platform.OS === 'web') {
          const projected = mapRef.current.project(lngLat);
          screenY = projected.y;
        }
        else {
          const projected = await mapRef.current.getPointInView(lngLat);
          screenY = projected[1];
        }
      }
      catch (err) {
        console.log('getPointInView failed for slot', i, err);
        screenY = screenPointY;
      }
      slotMap.push({
        lngLat,
        precedingIntervalId: i === 0 ? null : sorted[i - 1].properties.id,
        screenY,
      });
    }

    // Position snap line at the middle of the target interval by averaging
    // the two slot boundaries that bracket it
    const targetIndex = sorted.findIndex(s => s.properties.id === targetInterval.properties.id);
    const slotA = slotMap[targetIndex];
    const slotB = slotMap[targetIndex + 1] ?? slotA;
    const snapScreenY = slotA && slotB ? (slotA.screenY + slotB.screenY) / 2 : screenPointY;
    const snapLngLat = slotA?.lngLat && slotB?.lngLat
      ? [(slotA.lngLat[0] + slotB.lngLat[0]) / 2, (slotA.lngLat[1] + slotB.lngLat[1]) / 2]
      : slotA?.lngLat ?? slotMap[0]?.lngLat;

    dispatch(setIntervalDragState({
      stratSectionId: stratSection.strat_section_id,
      startScreenX: screenPointX,
      startScreenY: snapScreenY,
      startClientY: startClientY ?? screenPointY,
      slotMap,
      snapLngLat,
      snapScreenY,
      targetSlotIndex: targetIndex,
    }));
  };

  return {
    handleMapLongPress,
    handleMapPress,
    location,
    startIntervalDrag,
  };
};

export default useMapPressEvents;
