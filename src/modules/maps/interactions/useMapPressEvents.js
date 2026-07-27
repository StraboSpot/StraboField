import {useState} from 'react';
import {PixelRatio, Platform} from 'react-native';

import * as turf from '@turf/turf';
import {useDispatch, useSelector, useStore} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import {useSpots} from '../../spots';
import {setSelectedSpot} from '../../spots/spots.slice';
import useMapFeatures from '../features/useMapFeatures';
import useMapFeaturesCalculated from '../features/useMapFeaturesCalculated';
import {MAP_MODES} from '../maps.constants';
import {convertImagePixelsToLatLong} from '../maps.helpers';
import {setIntervalDragState} from '../maps.slice';
import useMap from '../useMap';
import useMapMeasure from '../useMapMeasure';

const useMapPressEvents = ({
                             clearSelectedSpots,
                             editSpot,
                             getSpotToEdit,
                             isEditingSpot,
                             mapMode,
                             mapRef,
                             measureFeatures,
                             setDistance,
                             setDrawFeaturesNew,
                             setIsShowMacrostratOverlay,
                             setIsShowSpotsAtPressModal,
                             setMapModeToEdit,
                             setMeasureFeatures,
                             setSpotsAtPress,
                             setSpotToEditFromPicker,
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
  const {getDrawFeatureAtPress, getSpotAtPress, getSpotsAtPress} = useMapFeaturesCalculated(mapRef);
  const {getMeasureFeatures} = useMapMeasure(mapRef);
  const {getSpotWithThisStratSection} = useSpots();
  const store = useStore();

  /* Local State */

  const [location, setLocation] = useState({coords: [0, 0], zoom: 16});
  // What the picker does with the tapped Spot ('select' | 'edit' | 'switch'); holds long-press coords for 'edit'.
  const [spotsAtPressAction, setSpotsAtPressAction] = useState(null);

  /* Internal Functions */

  const getScreenPoint = (e) => {
    if (Platform.OS === 'web') return [e.point.x, e.point.y];
    if (Platform.OS === 'android') {
      return [e.properties.screenPointX / PixelRatio.get(), e.properties.screenPointY / PixelRatio.get()];
    }
    return [e.properties.screenPointX, e.properties.screenPointY];
  };

  /* Exported Functions */

  // A long press acts on the Spot(s) under the press:
  //   VIEW mode -> start editing a Spot:
  //     - Several overlap -> show the picker so the user chooses which to edit.
  //     - Exactly one -> switch straight into editing it.
  //     - None -> do nothing.
  //   EDIT mode -> hand off to getSpotToEdit, which modifies the vertices of the Spot being edited
  //     (add/delete a polygon vertex, or open the add/delete/split actions for a line).
  const handleMapLongPress = async (e) => {
    console.log('Map long press detected:', e);
    const [screenPointX, screenPointY] = getScreenPoint(e);

    if (mapMode === MAP_MODES.VIEW && !isEmpty(getAllMappedSpots())) {
      const spotsToEdit = await getSpotsAtPress(screenPointX, screenPointY);
      // Several Spots overlap - let the user pick which to edit.
      if (spotsToEdit.length > 1) {
        setSpotsAtPress(spotsToEdit);
        setSpotsAtPressAction({screenPointX, screenPointY, type: 'edit'});
        setIsShowSpotsAtPressModal(true);
      }
      else if (spotsToEdit.length === 1) {
        await switchToEditing(screenPointX, screenPointY, spotsToEdit[0], setMapModeToEdit);
      }
      else console.log('No Spots to edit. No action taken.');
    }
    else if (mapMode === MAP_MODES.EDIT) {
      const spotToEdit = await getSpotAtPress(screenPointX, screenPointY);
      await getSpotToEdit(e, screenPointX, screenPointY, spotToEdit);
    }
    else console.log('No Spots to edit. No action taken.');
  };

  // A short press is routed by map mode:
  //   INTERVAL_DRAG (strat section) -> start dragging the strat interval under the press.
  //   MEASURE -> add the point to the measurement.
  //   DRAW -> add a draw feature (freehand line/polygon are handled on release, not here).
  //   VIEW -> select/deselect the Spot under the press:
  //     - Macrostrat basemap -> open the geology overlay and select a Spot (random when several overlap).
  //     - Several overlap -> show the picker so the user chooses which to select.
  //     - Exactly one -> select it.
  //     - None -> select the strat section's own Spot if in one, otherwise deselect.
  //   EDIT -> a vertex under the press is a vertex gesture (editSpot); otherwise switch to another Spot
  //     under the press (picker if several), deselect on empty space, or do nothing if only the edited
  //     Spot is under the press with no vertex.
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
        const isMacrostratBasemap = currentBasemap?.source === 'macrostrat' && !stratSection && !currentImageBasemap;
        // A Macrostrat press is really querying the geology at that point, so use a precise hit (only a
        // Spot directly under the press selects, not a nearby one).
        const spotsFound = await getSpotsAtPress(screenPointX, screenPointY, isMacrostratBasemap);
        if (isMacrostratBasemap) {
          setIsShowMacrostratOverlay(true);
          const currentZoom = await mapRef.current.getZoom();
          setLocation(
            {coords: (Platform.OS !== 'web' ? e.geometry?.coordinates : Object.values(e.lngLat)), zoom: currentZoom});
          // Skip the picker (it would stack over the overlay); pick at random so repeated taps can cycle.
          if (spotsFound.length >= 1) {
            dispatch(setSelectedSpot(spotsFound[Math.floor(Math.random() * spotsFound.length)]));
          }
          else clearSelectedSpots();
        }
        // Let the user pick when several Spots overlap rather than choosing one at random.
        else if (spotsFound.length > 1) {
          setSpotsAtPress(spotsFound);
          setSpotsAtPressAction({type: 'select'});
          setIsShowSpotsAtPressModal(true);
        }
        else if (spotsFound.length === 1) dispatch(setSelectedSpot(spotsFound[0]));
        // No Spot hit, but in a strat section: fall back to selecting the section's own Spot.
        else if (stratSection) {
          dispatch(setSelectedSpot(getSpotWithThisStratSection(stratSection.strat_section_id)));
        }
        else clearSelectedSpots();
      }
      // Draw a feature
      else if (isDrawMode(mapMode)) setDrawFeaturesNew(e);
      // Edit a Spot
      else if (mapMode === MAP_MODES.EDIT) {
        const [screenPointX, screenPointY] = getScreenPoint(e);
        // A vertex in the press box is a vertex gesture - let editSpot handle it.
        const vertexAtPress = isEditingSpot ? await getDrawFeatureAtPress(screenPointX, screenPointY) : {};
        if (!isEmpty(vertexAtPress)) await editSpot(e);
        else {
          // No vertex: switch Spots. Look at Spots under the press other than the one being edited.
          const spotsAtPress = await getSpotsAtPress(screenPointX, screenPointY);
          const editingSpotId = store.getState().spot.selectedSpot?.properties?.id;
          const otherSpots = isEditingSpot ? spotsAtPress.filter(spot => spot.properties.id !== editingSpotId)
            : spotsAtPress;
          if (otherSpots.length > 1) {
            setSpotsAtPress(otherSpots);
            setSpotsAtPressAction({type: 'switch'});
            setIsShowSpotsAtPressModal(true);
          }
          else if (otherSpots.length === 1) setSpotToEditFromPicker(otherSpots[0]);
          else if (spotsAtPress.length === 0) await editSpot(e);  // empty press - editSpot deselects
          // Only the edited Spot under the press, no vertex - do nothing (don't grab the nearest vertex).
          else console.log('Only the edited Spot at press and no vertex in box. No action taken.');
        }
      }
      else console.log('Error. Unknown map mode:', mapMode);
    }
  };

  // Act on the Spot picked from the overlapping-Spots picker: 'edit' enters editing, 'switch' switches, else select.
  const handleSpotAtPressSelected = async (spot) => {
    if (spotsAtPressAction?.type === 'edit') {
      await switchToEditing(spotsAtPressAction.screenPointX, spotsAtPressAction.screenPointY, spot, setMapModeToEdit);
    }
    else if (spotsAtPressAction?.type === 'switch') setSpotToEditFromPicker(spot);
    else dispatch(setSelectedSpot(spot));
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
    handleSpotAtPressSelected,
    isSpotsAtPressForEdit: spotsAtPressAction?.type === 'edit' || spotsAtPressAction?.type === 'switch',
    location,
    startIntervalDrag,
  };
};

export default useMapPressEvents;
