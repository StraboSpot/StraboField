import {useEffect} from 'react';
import {PixelRatio, Platform} from 'react-native';

import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import useMapDisplayedSpots from './useMapDisplayedSpots';
import useMapDraw from './useMapDraw';
import useMapEditVertex from './useMapEditVertex';
import useMapSelectionModes from './useMapSelectionModes';
import {isEmpty} from '../../../shared/helpers';
import {addedNewSpotIdsToDataset, updatedModifiedTimestampsBySpotsIds} from '../../project/projects.slice';
import useProject from '../../project/useProject';
import {clearedSelectedSpots, editedOrCreatedSpots, setSelectedSpot} from '../../spots/spots.slice';
import useMapFeaturesCalculated from '../features/useMapFeaturesCalculated';
import {MAP_MODES} from '../maps.constants';

// Orchestrates map editing: routes a raw map press/long-press (plus the current mapMode) to the right action
// and owns the edit lifecycle (enter/save/cancel) and displayed-Spot sync. Composes the geometry workers -
// useMapDraw (create new features) and useMapEditVertex (mutate an existing Spot's geometry).
const useMapEditor = ({
                        mapMode,
                        mapRef,
                        onEndDrawPressed,
                        selectingMode,
                        setIsShowVertexActionsModal,
                        setVertexActionValues,
                      }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const datasets = useSelector(state => state.project.datasets);
  const featureTypesOff = useSelector(state => state.map.featureTypesOff) || [];
  const geometryTypesOff = useSelector(state => state.map.geometryTypesOff) || [];
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);
  const stratSection = useSelector(state => state.map.stratSection);

  const {setDisplayedSpots, setDisplayedSpotsWhileEditing, spotsNotSelected, spotsSelected} = useMapDisplayedSpots();
  const {
    getDrawFeatureAtPress, getSpotAtPress, getSpotsAtPress, identifyClosestVertexOnSpotPress,
  } = useMapFeaturesCalculated(mapRef);
  const {applySelectingMode} = useMapSelectionModes({mapRef, spotsNotSelected});
  const {cancelDraw, drawFeatures, endDraw, setDrawFeatures, setDrawFeaturesNew} = useMapDraw({
    applySelectingMode,
    mapMode,
    mapRef,
    onEndDrawPressed,
    selectingMode,
  });
  const {
    addNewVertex,
    allowMapViewMove,
    clearEditing,
    clearSelectedFeatureToEdit,
    clearVertexes,
    deleteSelectedVertex,
    editFeatureVertex,
    extendLineFromEndpoint,
    getEditSession,
    getVertexIndexInSpotToEdit,
    moveVertex,
    setSelectedSpotToEdit,
    setSelectedVertexToEdit,
    setVertexIndex,
    spotEditing,
    spotsEdited,
    splitLine,
    startEditing,
    vertexIndex,
    vertexToEdit,
  } = useMapEditVertex({
    drawFeatures,
    mapMode,
    mapRef,
    setDisplayedSpotsWhileEditing,
    setDrawFeatures,
    spotsSelected,
  });
  const {getTargetDatasetFromId} = useProject();

  /* Side Effects */

  useEffect(() => {
    // console.log(
    //   'UE useMapEditor [spots, datasets, currentBasemap, currentImageBasemap, stratSection, featureTypesOff, geometryTypesOff]');
    setDisplayedSpots((isEmpty(selectedSpot) ? [] : [{...selectedSpot}]));
  }, [spots, datasets, currentBasemap, currentImageBasemap, featureTypesOff, geometryTypesOff, stratSection]);

  useEffect(() => {
    // console.log('UE useMapEditor [selectedSpot, activeDatasetsIds]');
    //conditional call to avoid multiple renders during edit mode.
    if (mapMode !== MAP_MODES.EDIT) setDisplayedSpots((isEmpty(selectedSpot) ? [] : [{...selectedSpot}]));
  }, [selectedSpot, activeDatasetsIds]);

  /* Event Handlers */

  const cancelEdits = async () => {
    console.log('Canceling editing...');
    if (!isEmpty(spotEditing)) {
      const spotOrig = spots[spotEditing.properties.id];
      if (spotOrig) {
        setDisplayedSpots([spotOrig]);
        dispatch(setSelectedSpot(spotOrig));
      }
      else clearSelectedSpots();
    }
    else setDisplayedSpots([]);
    clearEditing();
  };

  const clearSelectedSpots = () => {
    console.log('Clear selected Spots.');
    setDisplayedSpots([]);
    dispatch(clearedSelectedSpots());
  };

  // Handles a press in edit mode on a vertex or on empty map; handleMapPress handles a press on another Spot
  // itself. Does nothing unless a Spot is being edited. What happens depends on what is under the press:
  //   - One of the edited Spot's vertices -> select that vertex so it can be dragged.
  //   - A different Spot, with the edited Spot not under the press -> switch to editing that one.
  //   - No Spot (empty map) -> stop editing the Spot (edit mode stays on).
  // Where the edited Spot overlaps another, the edited Spot wins, so a nearby point Spot can't take a press
  // meant for a vertex.
  //
  // editSession is what getEditSession() returned when the press began. Save and Cancel change that value, so
  // if it no longer matches once a map query returns, the edit this press belongs to is over and the press is
  // dropped. The caller reads it, not this function, because the caller runs map queries of its own first and
  // a Save during those has to count too.
  const editSpot = async (e, editSession) => {
    const [screenPointX, screenPointY] = Platform.OS === 'web' ? [e.point.x, e.point.y]
      : Platform.OS === 'android' ? [e.properties.screenPointX / PixelRatio.get(), e.properties.screenPointY / PixelRatio.get()]
        : [e.properties.screenPointX, e.properties.screenPointY];
    console.log('Select/Unselect vertex (and thus feature with the vertex) to edit');
    console.log('Selecting feature to edit...');
    if (isEmpty(spotEditing)) {
      console.log('No feature selected.');
      return;
    }

    const spotsAtPress = await getSpotsAtPress(screenPointX, screenPointY);
    const isEditingSpotAtPress = spotsAtPress.some(spot => spot.properties.id === spotEditing.properties.id);
    const spotAtPress = isEditingSpotAtPress ? spotEditing : await getSpotAtPress(screenPointX, screenPointY);
    if (editSession !== getEditSession()) return;
    const spotFound = !isEmpty(spotAtPress) && spotAtPress?.geometry ? turf.cleanCoords(spotAtPress) : undefined;
    if (isEmpty(spotFound)) {
      clearSelectedFeatureToEdit();
      return;
    }
    // Select the Spot right away so the notebook panel shows it, including one just switched to (#114)
    dispatch(setSelectedSpot(spotFound));

    let closestVertexDetails = {};
    let isVertexIdentifiedAtSpotPress = false;
    let vertexSelected = await getDrawFeatureAtPress(screenPointX, screenPointY);
    if (!isEmpty(vertexSelected)) {
      // The draw layer holds only the edited Spot's vertices, so if a different Spot was found under the
      // press, ignore this vertex and use that Spot's vertex closest to the press below
      if (spotFound.properties.id !== vertexSelected.properties.id) vertexSelected = undefined;
    }
    if (isEmpty(vertexSelected)) {
      // No vertex of the Spot found is under the press, so take its vertex closest to the press
      closestVertexDetails = await identifyClosestVertexOnSpotPress(spotFound, screenPointX, screenPointY,
        spotsEdited);
      vertexSelected = closestVertexDetails[0];
      isVertexIdentifiedAtSpotPress = true;
    }
    if (editSession !== getEditSession()) return;
    if (isEmpty(vertexSelected)) {
      if (spotEditing.properties.id === spotFound.properties.id) clearSelectedFeatureToEdit();
      else {
        // Switch to the edited copy if the Spot has one, so its unsaved changes aren't lost
        let editedSpot = spotsEdited.find(
          spot => spot.properties.id === spotFound.properties.id);
        setSelectedSpotToEdit(isEmpty(editedSpot) ? spotFound : editedSpot);
      }
    }
    else {
      if (isVertexIdentifiedAtSpotPress) {
        // The vertex is the closest one on the Spot found, which may be a different Spot: make that the
        // edited Spot (its edited copy if it has one), then select the vertex
        let editedSpot = spotsEdited.find(
          spot => spot.properties.id === spotFound.properties.id);
        setSelectedSpotToEdit(isEmpty(editedSpot) ? spotFound : editedSpot);
        if (spotFound.geometry.type !== 'Point') { // a Point's vertex is selected by setSelectedSpotToEdit
          await setSelectedVertexToEdit(vertexSelected);
          setVertexIndex(closestVertexDetails[1]);
        }
      }
      // A vertex of the edited Spot was pressed directly
      else await setSelectedVertexToEdit(vertexSelected);
    }
  };

  // A long press in edit mode on the Spot being edited changes its vertices: on a line it opens the vertex
  // actions modal; on a polygon it deletes the vertex under the press, or adds one there if there is none.
  //
  // editSession is what getEditSession() returned when the press began, read by the caller before its own map
  // queries. If Save or Cancel has changed it once a query returns, the edit is over and the press is dropped.
  const getSpotToEdit = async (e, screenPointX, screenPointY, spotToEdit, editSession) => {
    const vertexSelected = isEmpty(spotEditing) ? {} : await getDrawFeatureAtPress(screenPointX, screenPointY);
    // Treat the press as on the edited Spot when its body OR a vertex of it is under the press (the vertex
    // check covers corner presses where the fill isn't under the point), so a nearby point Spot can't block it.
    if (!isEmpty(spotEditing)) {
      const spotsAtPress = await getSpotsAtPress(screenPointX, screenPointY);
      const isEditingSpotAtPress = spotsAtPress.some(spot => spot.properties.id === spotEditing.properties.id)
        || (!isEmpty(vertexSelected) && String(vertexSelected.properties.id) === String(spotEditing.properties.id));
      if (isEditingSpotAtPress) spotToEdit = spotEditing;
    }
    if (editSession !== getEditSession()) return;
    if (isEmpty(spotToEdit)) console.log('Already in editing mode and no Spot found where pressed. No action taken.');
    else if (!isEmpty(spotEditing)) {
      let spotEditingCopy = JSON.parse(JSON.stringify(spotEditing));
      if (turf.getType(spotEditingCopy) === 'LineString' || turf.getType(spotEditingCopy) === 'Polygon') {
        if (spotEditingCopy.properties.id === spotToEdit.properties.id) {
          if (turf.getType(spotEditingCopy) === 'LineString') {
            // Flag an endpoint press (first/last coordinate) so the modal can offer "Extend Line".
            const vertexIndices = isEmpty(vertexSelected) ? [] : getVertexIndexInSpotToEdit(vertexSelected);
            const isEndpointVertex = vertexIndices.includes(0)
              || vertexIndices.includes(spotEditingCopy.geometry.coordinates.length - 1);
            setVertexActionValues({
              e: e,
              isEndpointVertex: isEndpointVertex,
              spotEditingCopy: spotEditingCopy,
              spotToEdit: spotToEdit,
              vertexSelected: isEmpty(vertexSelected) ? undefined : vertexSelected,
            });
            setIsShowVertexActionsModal(true);
          }
          else {
            if (isEmpty(vertexSelected)) addNewVertex(e, spotEditingCopy, spotToEdit);
            else deleteSelectedVertex(spotEditingCopy, vertexSelected);
          }
        }
        else console.log('Invalid vertex selected. No action');
      }
      else console.log('Selected Spot is not a line or polygon. No action taken.');
    }
    else console.log('No feature selected. No action taken.');
  };

  // The VertexDrag overlay swallows the map's long press on a selected vertex, so re-run it here from the
  // vertex we already have: delete a polygon vertex, or reopen the actions modal for a line endpoint.
  const handleSelectedVertexLongPress = () => {
    if (isEmpty(spotEditing)) return;
    const geometryType = turf.getType(spotEditing);
    if (geometryType !== 'Polygon' && geometryType !== 'LineString') return;
    // A tapped vertex is in vertexToEdit; a just-added one is tracked only by vertexIndex (Add clears
    // vertexToEdit) - fall back to that draw feature.
    const vertexSelected = !isEmpty(vertexToEdit) ? vertexToEdit
      : typeof vertexIndex === 'number' ? drawFeatures[vertexIndex] : undefined;
    if (isEmpty(vertexSelected)) return;
    const spotEditingCopy = JSON.parse(JSON.stringify(spotEditing));
    if (geometryType === 'Polygon') {
      deleteSelectedVertex(spotEditingCopy, vertexSelected);
      clearVertexes();  // remove the now-orphaned drag overlay for the deleted vertex
    }
    else {
      const vertexIndices = getVertexIndexInSpotToEdit(vertexSelected);
      const isEndpointVertex = vertexIndices.includes(0)
        || vertexIndices.includes(spotEditingCopy.geometry.coordinates.length - 1);
      if (!isEndpointVertex) return;
      setVertexActionValues({
        isEndpointVertex: true,
        spotEditingCopy: spotEditingCopy,
        spotToEdit: spotEditingCopy,
        vertexSelected: vertexSelected,
      });
      setIsShowVertexActionsModal(true);
    }
  };

  const saveEdits = () => {
    // console.log('Saving edits...', 'spotsNotEdited', spotsNotEdited, 'spotsEdited', spotsEdited);
    console.log('Saving edits...', 'spotsEdited', spotsEdited);
    if (isEmpty(spotEditing)) setDisplayedSpots([]);
    else {
      setDisplayedSpots([spotEditing]);
      dispatch(setSelectedSpot(spotEditing));
    }
    if (!isEmpty(spotsEdited)) {
      const spotIds = spotsEdited.map(s => s.properties.id);
      const targetDataset = getTargetDatasetFromId();
      if (!isEmpty(targetDataset)) {
        dispatch(addedNewSpotIdsToDataset({datasetId: targetDataset.id, spotIds: spotIds}));
        dispatch(updatedModifiedTimestampsBySpotsIds(spotIds));
        dispatch(editedOrCreatedSpots(spotsEdited));
      }
    }
    clearEditing();
  };

  // Edit the Spot picked from the overlapping-Spots picker; reuses its in-progress edited copy so a switch
  // doesn't discard edits.
  const setSpotToEditFromPicker = (spot) => {
    const editedSpot = spotsEdited.find(s => s.properties.id === spot.properties.id);
    const spotToEdit = isEmpty(editedSpot) ? spot : editedSpot;
    dispatch(setSelectedSpot(spotToEdit));
    setSelectedSpotToEdit(spotToEdit);
  };

  const switchToEditing = async (screenPointX, screenPointY, spotToEdit, setMapModeToEdit) => {
    let closestVertexDetails = {};
    let closestVertexToSelect = await getDrawFeatureAtPress(screenPointX, screenPointY);
    if (isEmpty(closestVertexToSelect)) {
      // draw features did not return anything - generally a scenario of selecting a vertex on a spot long press.
      closestVertexDetails = await identifyClosestVertexOnSpotPress(spotToEdit, screenPointX, screenPointY,
        spotsEdited);
      closestVertexToSelect = closestVertexDetails[0];
      startEditing(spotToEdit, closestVertexToSelect, closestVertexDetails[1], setMapModeToEdit);
    }
  };

  return {
    addNewVertex,
    allowMapViewMove,
    cancelDraw,
    cancelEdits,
    clearSelectedSpots,
    clearVertexes,
    deleteSelectedVertex,
    drawFeatures,
    editFeatureVertex,
    editSpot,
    endDraw,
    extendLineFromEndpoint,
    getEditSession,
    getSpotToEdit,
    handleSelectedVertexLongPress,
    hasPendingEdits: !isEmpty(spotsEdited),
    isEditingSpot: !isEmpty(spotEditing),
    moveVertex,
    saveEdits,
    setDrawFeaturesNew,
    setSpotToEditFromPicker,
    splitLine,
    spotsNotSelected,
    spotsSelected,
    startEditing,
    switchToEditing,
  };
};

export default useMapEditor;
