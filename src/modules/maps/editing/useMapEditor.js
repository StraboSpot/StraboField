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

  const editSpot = async (e) => {
    // Select/Unselect new vertex to edit
    const [screenPointX, screenPointY] = Platform.OS === 'web' ? [e.point.x, e.point.y]
      : Platform.OS === 'android' ? [e.properties.screenPointX / PixelRatio.get(), e.properties.screenPointY / PixelRatio.get()]
        : [e.properties.screenPointX, e.properties.screenPointY];
    console.log('Select/Unselect vertex (and thus feature with the vertex) to edit');
    console.log('Selecting feature to edit...');

    // Pick what to edit from where the user pressed:
    //
    // No Spot is being edited yet:
    //   - Nothing under the press -> do nothing.
    //   - A Spot under the press -> make it the edited Spot (all others become not-selected; a line or
    //     polygon has its vertices exploded onto the draw layer).
    //
    // A Spot is already being edited (prefer that Spot when it's under the press, so a nearby point Spot
    // can't steal a vertex tap):
    //   - Nothing under the press -> deselect the edited Spot.
    //   - A different Spot under the press (and no vertex of the edited Spot) -> switch to editing it.
    //   - A vertex of the edited Spot under the press -> make it the selected vertex to edit.
    let spotAtPress;
    if (!isEmpty(spotEditing)) {
      const spotsAtPress = await getSpotsAtPress(screenPointX, screenPointY);
      const isEditingSpotAtPress = spotsAtPress.some(spot => spot.properties.id === spotEditing.properties.id);
      spotAtPress = isEditingSpotAtPress ? spotEditing : await getSpotAtPress(screenPointX, screenPointY);
    }
    else spotAtPress = await getSpotAtPress(screenPointX, screenPointY);
    const spotFound = !isEmpty(spotAtPress) && spotAtPress?.geometry ? turf.cleanCoords(spotAtPress) : undefined;
    // #114, while editing, click on a different spot to edit, should immediately identify it as the selected spot and hence update the notebook panel.
    if (!isEmpty(spotFound)) dispatch(setSelectedSpot(spotFound));
    if (isEmpty(spotEditing)) {
      if (isEmpty(spotFound)) console.log('No feature selected.');
      else setSelectedSpotToEdit(spotFound);
    }
    else {
      let closestVertexDetails = {};
      let isVertexIdentifiedAtSpotPress = false;
      if (isEmpty(spotFound)) clearSelectedFeatureToEdit();
      else {
        let vertexSelected = await getDrawFeatureAtPress(screenPointX, screenPointY);
        if (!isEmpty(vertexSelected)) {
          // When draw features identifies a vertex that is not on the spot found, mark it undefined so that,
          // we can calculate a vertex on the spot found that is closest to the press.
          if (spotFound.properties.id !== vertexSelected.properties.id) vertexSelected = undefined;
        }
        if (isEmpty(vertexSelected)) {
          // draw features did not return anything - generally a scenario of selecting a vertex on a spot press.
          closestVertexDetails = await identifyClosestVertexOnSpotPress(spotFound, screenPointX, screenPointY,
            spotsEdited);
          vertexSelected = closestVertexDetails[0];
          isVertexIdentifiedAtSpotPress = true;
        }
        if (isEmpty(vertexSelected)) {
          if (spotEditing.properties.id === spotFound.properties.id) clearSelectedFeatureToEdit();
          else {
            //if the spot is in already edited list, then get the spot from that list.
            let editedSpot = spotsEdited.find(
              spot => spot.properties.id === spotFound.properties.id);
            setSelectedSpotToEdit(isEmpty(editedSpot) ? spotFound : editedSpot);
          }
        }
        else {
          //if the vertex is not empty, check if it's identified at spot press or vertex press
          if (isVertexIdentifiedAtSpotPress) {
            //  this is the case when the spot and vertex are chosen to be edited at once.
            let editedSpot = spotsEdited.find(
              spot => spot.properties.id === spotFound.properties.id);
            setSelectedSpotToEdit(isEmpty(editedSpot) ? spotFound : editedSpot);
            if (spotFound.geometry.type !== 'Point') { // if Point, vertex gets set by setSelectedSpotToEdit already.
              await setSelectedVertexToEdit(vertexSelected);
              setVertexIndex(closestVertexDetails[1]);
            }
          }
          else await setSelectedVertexToEdit(vertexSelected);
          // this is the case when the spot is already highlighted for edit and a vertex is chosen to edit.
        }
      }
    }
  };

  const getSpotToEdit = async (e, screenPointX, screenPointY, spotToEdit) => {
    const vertexSelected = isEmpty(spotEditing) ? {} : await getDrawFeatureAtPress(screenPointX, screenPointY);
    // Treat the press as on the edited Spot when its body OR a vertex of it is under the press (the vertex
    // check covers corner presses where the fill isn't under the point), so a nearby point Spot can't block it.
    if (!isEmpty(spotEditing)) {
      const spotsAtPress = await getSpotsAtPress(screenPointX, screenPointY);
      const isEditingSpotAtPress = spotsAtPress.some(spot => spot.properties.id === spotEditing.properties.id)
        || (!isEmpty(vertexSelected) && String(vertexSelected.properties.id) === String(spotEditing.properties.id));
      if (isEditingSpotAtPress) spotToEdit = spotEditing;
    }
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
    getSpotToEdit,
    handleSelectedVertexLongPress,
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
