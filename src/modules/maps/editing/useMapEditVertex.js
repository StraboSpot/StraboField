import {useEffect, useState} from 'react';
import {Platform} from 'react-native';

import * as turf from '@turf/turf';
import proj4 from 'proj4';
import {useDispatch, useSelector} from 'react-redux';

import {getNewId, getNewUUID, isEmpty} from '../../../shared/helpers';
import {clearedSelectedSpots, setSelectedSpot} from '../../spots/spots.slice';
import useMapFeatures from '../features/useMapFeatures';
import {GEO_LAT_LNG_PROJECTION, MAP_MODES, PIXEL_PROJECTION} from '../maps.constants';
import {getClosestSpotDistanceAndIndex} from '../maps.helpers';
import {
  deleteVertexFromGeometry,
  extendLineAtEndpoint,
  getFeatureWithNewVertex,
  splitLineAtVertex,
} from './editing.helpers';
import {clearedVertexes, setVertexStartCoords} from '../maps.slice';
import useMap from '../useMap';
import useMapCoords from '../view/useMapCoords';

// Owns the in-progress edit session: which Spot/vertex is being edited, the exploded draw-vertex overlay it
// projects onto the draw layer, and every geometry-mutation primitive (move/add/delete/split/extend a vertex).
// It is a pure lower layer under useMapEditor - it never calls back into the gesture-routing orchestrator.
const useMapEditVertex = ({
                               drawFeatures,
                               mapMode,
                               mapRef,
                               setDisplayedSpotsWhileEditing,
                               setDrawFeatures,
                               spotsSelected,
                             }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const stratSection = useSelector(state => state.map.stratSection);
  const vertexEndCoords = useSelector(state => state.map.vertexEndCoords);

  const {isDrawMode} = useMap();
  const {convertFeatureGeometryToImagePixels, convertImagePixelsToLatLong} = useMapCoords();
  const {getAllMappedSpots} = useMapFeatures();

  /* Local State */

  const [allowMapViewMove, setAllowMapViewMove] = useState(true); // VIEW mode (initial) allows map movement
  const [editFeatureVertex, setEditFeatureVertex] = useState([]);
  const [spotEditing, setSpotEditing] = useState({});
  const [spotsEdited, setSpotsEdited] = useState([]);
  const [spotsNotEdited, setSpotsNotEdited] = useState([]);
  const [vertexIndex, setVertexIndex] = useState([]);
  const [vertexToEdit, setVertexToEdit] = useState([]);

  /* Side Effects */

  useEffect(() => {
    // console.log('UE useMapEditVertex [mapMode, spotEditing]');
    // Lock the map while drawing or editing a Spot; EDIT with nothing selected stays movable for panning.
    setAllowMapViewMove(!(isDrawMode(mapMode) || (mapMode === MAP_MODES.EDIT && !isEmpty(spotEditing))));
  }, [mapMode, spotEditing]);

  useEffect(() => {
    // console.log('UE useMapEditVertex [vertexEndCoords]');
    if (!isEmpty(vertexEndCoords && mapMode === MAP_MODES.EDIT)) moveVertex();
  }, [vertexEndCoords]);

  /* Internal Functions */

  const clearSelectedSpotsWhileEditing = () => {
    console.log('Clear selected Spots.');
    setDisplayedSpotsWhileEditing([], spotsEdited, spotsNotEdited);
    dispatch(clearedSelectedSpots());
  };

  const clearSelectedVertexToEdit = () => {
    setVertexToEdit({});
    setEditFeatureVertex([]);
    console.log('Cleared selected vertex to edit.');
    clearVertexes();
  };

  // Edit the coordinates of a selected feature
  const editSpotCoordinates = (newCoord) => {
    console.log('In editSpotCoordinates', newCoord);
    if (isEmpty(spotEditing)) console.log('No Spot to edit selected');
    else {
      if (!vertexToEdit) console.log('No vertex to edit selected');
      else {
        console.log('Editing Coordinate');
        let spotEditingCopy = JSON.parse(JSON.stringify(spotEditing));
        console.log('Feature Editing:', spotEditingCopy);
        let coords;
        try {
          coords = turf.getCoords(spotEditingCopy);
        }
        catch {
          console.warn('error use getCoords on spotEditingCopy', spotEditingCopy);
          coords = spotEditingCopy.geometry.coordinates;
        }
        let isModified = false;
        if (turf.getType(spotEditingCopy) === 'Point') {
          spotEditingCopy.geometry.coordinates = newCoord;
          isModified = true;
        }
          // identify the coordinates to edit, uses the tempEditId on drawFeatures and vertex to edit.
          // the index on drawFeatures array that matches with vertex to edit is the index of the coordinates to be edited
        // on the actual polygon or linestring.
        else {
          let indexOfCoordinatesToUpdate = getVertexIndexInSpotToEdit(vertexToEdit);
          if (!isEmpty(indexOfCoordinatesToUpdate)) {
            if (indexOfCoordinatesToUpdate.includes(0)) setVertexIndex(0);
            else setVertexIndex(indexOfCoordinatesToUpdate);
          }
          if (currentImageBasemap || stratSection) newCoord = proj4(GEO_LAT_LNG_PROJECTION, PIXEL_PROJECTION, newCoord);
          if (turf.getType(spotEditingCopy) === 'LineString') {
            if (!isEmpty(vertexIndex)) {
              spotEditingCopy.geometry.coordinates[vertexIndex] = newCoord;
            }
            else {
              for (let j = 0; j < coords.length; j++) {
                if (indexOfCoordinatesToUpdate.includes(j)) {
                  spotEditingCopy.geometry.coordinates[j] = newCoord;
                }
              }
            }
            isModified = true;
          }
          else if (turf.getType(spotEditingCopy) === 'Polygon') {
            if (!isEmpty(vertexIndex)) {
              spotEditingCopy.geometry.coordinates[0][vertexIndex] = newCoord;
              if (vertexIndex === 0) spotEditingCopy.geometry.coordinates[0][drawFeatures.length] = newCoord;
              else if (vertexIndex === drawFeatures.length) spotEditingCopy.geometry.coordinates[0][0] = newCoord;
              isModified = true;
            }
            else {
              // if its first index, that needs to be edited, for a polygon, the last and first coordinates
              //point to the same one, so both should be updated.
              if (indexOfCoordinatesToUpdate.includes(0)) indexOfCoordinatesToUpdate.push(drawFeatures.length);
              for (let i = 0; i < coords.length; i++) {
                for (let j = 0; j < coords[i].length; j++) {
                  if (indexOfCoordinatesToUpdate.includes(j)) {
                    spotEditingCopy.geometry.coordinates[i][j] = newCoord;
                    isModified = true;
                  }
                }
              }
            }
          }
        }
        if (isModified) {
          spotEditingCopy.properties.modified_timestamp = Date.now();
          console.log('Finished editing Spot. Edited Spot:', spotEditingCopy, 'Selected Spots:', spotsSelected);
        }
        else console.warn('Problem editing Spot');
        console.log('Edited coords:', turf.getCoords(spotEditingCopy));
        let explodedFeatures = turf.explode(spotEditingCopy).features;
        // If polygon remove last exploded point because it is the same as the first
        if (turf.getType(spotEditingCopy) === 'Polygon') explodedFeatures.pop();
        explodedFeatures = explodedFeatures.map((feature) => {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              tempEditId: getNewUUID(),
            },
          };
        });
        if (currentImageBasemap || stratSection) { // if imagebasemap, features, need to be converted to getLatLng inOrder to project them.
          if (turf.getType(spotEditingCopy) === 'Polygon' || turf.getType(spotEditingCopy) === 'LineString') {
            explodedFeatures = explodedFeatures.map(spot => convertImagePixelsToLatLong(spot));
          }
        }
        setDrawFeatures(explodedFeatures);
        const spotsEditedTmp = spotsEdited.filter(
          spotEdited => spotEdited.properties.id !== spotEditingCopy.properties.id);
        spotsEditedTmp.push(spotEditingCopy);
        const spotsNotEditedTmp = spotsNotEdited.filter(
          spotNotEdited => spotNotEdited.properties.id !== spotEditingCopy.properties.id);
        setSpotEditing(spotEditingCopy);
        setSpotsEdited(spotsEditedTmp);
        setSpotsNotEdited(spotsNotEditedTmp);
        setDisplayedSpotsWhileEditing(spotEditingCopy, spotsEditedTmp, spotsNotEditedTmp);
        // this clears the initial feature vertex that is selected.
        setEditFeatureVertex([]);
        console.log('Finished editing Spot. Spot Editing: ', spotEditingCopy);
      }
    }
  };

  const getSpotToEditCont = (spotEditingCopy) => {
    console.log('Edited coords:', turf.getCoords(spotEditingCopy));
    let explodedFeatures = turf.explode(spotEditingCopy).features;
    // If polygon remove last exploded point because it is the same as the first
    if (turf.getType(spotEditingCopy) === 'Polygon') explodedFeatures.pop();
    explodedFeatures = explodedFeatures.map((feature) => {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          tempEditId: getNewUUID(),
        },
      };
    });
    if (currentImageBasemap || stratSection) { // if imagebasemap, features, need to be converted to getLatLng inOrder to project them.
      if (turf.getType(spotEditingCopy) === 'Polygon' || turf.getType(spotEditingCopy) === 'LineString') {
        explodedFeatures = explodedFeatures.map(spot => convertImagePixelsToLatLong(spot));
      }
    }
    // setDrawFeatures(explodedFeatures);
    // setMapFeatures(prevState => ({...prevState, draw: explodedFeatures}));
    const spotsEditedTmp = spotsEdited.filter(
      spotEdited => spotEdited.properties.id !== spotEditingCopy.properties.id);
    spotsEditedTmp.push(spotEditingCopy);
    const spotsNotEditedTmp = spotsNotEdited.filter(
      spotNotEdited => spotNotEdited.properties.id !== spotEditingCopy.properties.id);
    setSpotEditing(spotEditingCopy);
    setSpotsEdited(spotsEditedTmp);
    setSpotsNotEdited(spotsNotEditedTmp);
    setDisplayedSpotsWhileEditing(spotEditingCopy, spotsEditedTmp, spotsNotEditedTmp);
    clearSelectedVertexToEdit();
    //setSelectedVertexToEdit(vertexToEditThisScope);
    console.log('Finished editing Spot. Spot Editing: ', spotEditingCopy);
    setDrawFeatures(explodedFeatures);
  };

  // Identify the vertex which has to be updated
  const getVertexIndexInSpotToEdit = (vertex) => {
    if (isEmpty(vertex)) {
      return {};
    }
    let indexOfCoordinatesToUpdate = [];
    for (let index = 0; index < drawFeatures.length; index++) {
      if (drawFeatures[index].properties.tempEditId === vertex.properties.tempEditId) {
        indexOfCoordinatesToUpdate.push(index);
      }
    }
    // Fallback: a just-added vertex's tempEditId is regenerated (getSpotToEditCont) and can lag the render,
    // so the id match fails. Coordinates are stable - match the closest drawFeature to the pressed vertex.
    if (isEmpty(indexOfCoordinatesToUpdate) && vertex.geometry?.coordinates) {
      const [vertexX, vertexY] = vertex.geometry.coordinates;
      const distances = drawFeatures.map((feature) => {
        const coords = feature.geometry?.coordinates;
        return coords ? Math.abs(coords[0] - vertexX) + Math.abs(coords[1] - vertexY) : Number.MAX_VALUE;
      });
      const [, closestIndex] = getClosestSpotDistanceAndIndex(distances);
      if (closestIndex !== -1) indexOfCoordinatesToUpdate.push(closestIndex);
    }
    return indexOfCoordinatesToUpdate;
  };

  const setEditFeatures = (spotToEdit) => {
    // Get the draw features for the Spot (the individual vertex and lines that make up the Spot)
    let explodedFeatures = turf.explode(spotToEdit).features;
    // If polygon remove last exploded point because it is the same as the first
    if (turf.getType(spotToEdit) === 'Polygon') explodedFeatures.pop();
    explodedFeatures = explodedFeatures.map((feature) => {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          tempEditId: getNewUUID(),
        },
      };
    });
    if (currentImageBasemap || stratSection) { // if imagebasemap, features, need to be converted to getLatLng inOrder to project them.
      if (turf.getType(spotToEdit) === 'Polygon' || turf.getType(spotToEdit) === 'LineString') {
        explodedFeatures = explodedFeatures.map(spot => convertImagePixelsToLatLong(spot));
      }
    }
    setDrawFeatures(explodedFeatures);
  };

  const setSelectedVertexToEdit = async (vertex) => {
    console.log('setSelectedVertexToEdit, vertex:', vertex);
    let vertexToEditWithGeoCoords = JSON.parse(JSON.stringify(vertex));
    if ((currentImageBasemap || stratSection)
      && ((isEmpty(spotEditing) || ((!isEmpty(spotEditing) && spotEditing.geometry.type === 'Point'))
        || (!isEmpty(spotEditing) && spotEditing.properties.name !== vertex.properties.name)))) {
      vertexToEditWithGeoCoords = convertImagePixelsToLatLong(vertexToEditWithGeoCoords);
    }
    clearVertexes();
    setVertexToEdit(vertexToEditWithGeoCoords);
    setVertexIndex(undefined);
    console.log('Set vertex to edit:', vertexToEditWithGeoCoords);
    setEditFeatureVertex([vertexToEditWithGeoCoords]);
    setAllowMapViewMove(false);
    const vertexGeoCoords = vertexToEditWithGeoCoords.geometry.coordinates;
    let vertexScreenCoords = Platform.OS === 'web' ? mapRef.current.project(vertexGeoCoords)
      : await mapRef.current.getPointInView(vertexGeoCoords);
    if (Platform.OS === 'web') vertexScreenCoords = [vertexScreenCoords.x, vertexScreenCoords.y];
    // getPointInView seems to include pixel ratio adjustment for Android
    // now after updating @rnmapbox/maps from v10.1.39 to v10.2.10
    // else if (Platform.OS === 'android') {
    //   vertexScreenCoords = [vertexScreenCoords[0] / PixelRatio.get(), vertexScreenCoords[1] / PixelRatio.get()];
    // }
    dispatch(setVertexStartCoords(vertexScreenCoords));
  };

  const setSelectedSpotToEdit = (spotToEdit) => {
    console.log('setSelectedSpotToEdit spotToEdit', spotToEdit);
    clearSelectedVertexToEdit();
    setSpotEditing(spotToEdit);
    console.log('Set selected Spot to edit:', spotToEdit);
    setDisplayedSpotsWhileEditing(spotToEdit, spotsEdited, spotsNotEdited);
    setEditFeatures(spotToEdit);
    if (turf.getType(spotToEdit) === 'Point') setSelectedVertexToEdit(spotToEdit);
  };

  const moveVertex = async () => {
    try { // on imagebasemap, if spot is not point, conversion happens in editSpotCoordinates.
      const newVertexCoords = Platform.OS === 'web' ? mapRef.current.unproject(vertexEndCoords).toArray()
        : await mapRef.current.getCoordinateFromView(vertexEndCoords);
      if ((currentImageBasemap || stratSection) && spotEditing && turf.getType(spotEditing) === 'Point') {
        const vertexCoordinates = proj4(GEO_LAT_LNG_PROJECTION, PIXEL_PROJECTION,
          [newVertexCoords[0], newVertexCoords[1]]);
        console.log('Move vertex to:', vertexCoordinates);
        editSpotCoordinates([vertexCoordinates[0], vertexCoordinates[1]]);
      }
      else {
        console.log('Move vertex to:', newVertexCoords);
        editSpotCoordinates(newVertexCoords);
      }
    }
    catch {
      console.error('Problem moving the vertex');
    }
  };

  /* Exported Functions */

  const addNewVertex = (e, spotEditingCopy, spotToEdit) => {
    console.log('Adding new vertex...');
    let vertexAdded = {};
    // To add a vertex to a line the new point selected must be on the line
    if ((turf.getType(spotEditingCopy) === 'LineString' || turf.getType(spotEditingCopy) === 'Polygon')
      && !isEmpty(spotToEdit)) {
      if (currentImageBasemap || stratSection) {
        spotEditingCopy = convertImagePixelsToLatLong(spotEditingCopy);
        [spotEditingCopy, vertexAdded] = getFeatureWithNewVertex(e, spotEditingCopy);
        spotEditingCopy = convertFeatureGeometryToImagePixels(spotEditingCopy);
        setSelectedSpotToEdit(convertFeatureGeometryToImagePixels(vertexAdded));
      }
      else {
        [spotEditingCopy, vertexAdded] = getFeatureWithNewVertex(e, spotEditingCopy);
        setSelectedSpotToEdit(vertexAdded);
      }
      setVertexIndex(vertexAdded.properties.index + 1);
    }
    getSpotToEditCont(spotEditingCopy);
    // getSpotToEditCont clears editFeatureVertex, which web drags off; repopulate it so the just-added vertex
    // is selected right away. Native uses vertexStartCoords instead. See extendLineFromEndpoint. On an image
    // basemap/strat section vertexAdded was mutated to pixel coords above, so convert back to geo for the layer.
    if (Platform.OS === 'web' && !isEmpty(vertexAdded)) {
      const editVertex = turf.point([...turf.getCoord(vertexAdded)]);
      setEditFeatureVertex(
        [currentImageBasemap || stratSection ? convertImagePixelsToLatLong(editVertex) : editVertex]);
    }
  };

  const clearEditing = () => {
    console.log('Clearing editing data...');
    clearVertexes();
    setSpotEditing({});
    setSpotsEdited([]);
    setSpotsNotEdited([]);
    setVertexToEdit([]);
    setVertexIndex([]);
    setDrawFeatures([]);
    clearSelectedVertexToEdit();
  };

  const clearSelectedFeatureToEdit = () => {
    console.log('Clearing selected Spot.');
    clearSelectedSpotsWhileEditing();
    setSpotEditing({});
    setDrawFeatures([]);
    clearSelectedVertexToEdit();
    console.log('Cleared selected Spot.');
  };

  const clearVertexes = () => dispatch(clearedVertexes());

  const deleteSelectedVertex = (spotEditingCopy, vertexSelected) => {
    console.log('Deleting selected vertex...');
    const indexOfCoordinatesToUpdate = getVertexIndexInSpotToEdit(vertexSelected);
    const [updatedSpot, isModified] = deleteVertexFromGeometry(spotEditingCopy, indexOfCoordinatesToUpdate);
    if (isModified) {
      updatedSpot.properties.modified_timestamp = Date.now();
      console.log('Finished deleting vertex. Edited Spot:', updatedSpot);
    }
    else console.warn('Problem editing Spot');
    getSpotToEditCont(updatedSpot);
  };

  // Grow a line from an endpoint: duplicate that endpoint and select the copy to drag out, leaving the
  // original in place.
  const extendLineFromEndpoint = (spotEditingCopy, vertexSelected) => {
    console.log('Extending line from endpoint...');
    if (turf.getType(spotEditingCopy) !== 'LineString' || isEmpty(vertexSelected)) {
      console.log('Can only extend a line from a selected endpoint vertex. No action taken.');
      return;
    }
    const indexOfEndpoint = getVertexIndexInSpotToEdit(vertexSelected);
    const extended = extendLineAtEndpoint(spotEditingCopy, indexOfEndpoint);
    if (!extended) {
      console.log('Selected vertex is not an endpoint of the line. No action taken.');
      return;
    }
    const {updatedFeature, newVertexCoord, newVertexIndex} = extended;
    updatedFeature.properties.modified_timestamp = Date.now();
    // newVertexCoord already matches spotEditingCopy's projection, which is what setSelectedSpotToEdit wants.
    setSelectedSpotToEdit(turf.point(newVertexCoord));
    setVertexIndex(newVertexIndex);
    getSpotToEditCont(updatedFeature);
    // getSpotToEditCont cleared editFeatureVertex; on web the drag reads from that layer (native uses
    // vertexStartCoords), so repopulate it for an immediate drag. Leave vertexToEdit empty so the drag
    // targets by index - the duplicated endpoint coordinate is ambiguous by position.
    if (Platform.OS === 'web') {
      const editVertex = turf.point([...newVertexCoord]);
      setEditFeatureVertex([currentImageBasemap || stratSection ? convertImagePixelsToLatLong(editVertex)
        : editVertex]);
    }
  };

  const splitLine = async (e, spotEditingCopy, spotToEdit, vertexSelected) => {
    console.log('Splitting Line...', e, spotEditingCopy, spotToEdit, vertexSelected);
    let vertexAdded = {};
    if (currentImageBasemap || stratSection) {
      spotEditingCopy = convertImagePixelsToLatLong(spotEditingCopy);
      [spotEditingCopy, vertexAdded] = getFeatureWithNewVertex(e, spotEditingCopy);
    }
    else {
      [spotEditingCopy, vertexAdded] = getFeatureWithNewVertex(e, spotEditingCopy);
    }
    console.log('feature w new vertex', spotEditingCopy);
    console.log('new vertex', vertexAdded);

    // Get geometries for split lines
    const [lineSplit1, lineSplit2] = splitLineAtVertex(spotEditingCopy, vertexAdded);
    console.log('Split Line 1 Geometry', lineSplit1.geometry);
    console.log('Split Line 2 Geometry', lineSplit2.geometry);

    // Set attributes in new split lines
    let newLine1 = turf.clone(spotEditingCopy);
    newLine1.geometry = lineSplit1.geometry;
    let newLine2 = {
      geometry: lineSplit2.geometry,
      properties: {id: getNewId(), modified_timestamp: Date.now()},
      type: 'Feature',
    };
    if (spotEditingCopy.properties.date) newLine2.properties.date = spotEditingCopy.properties.date;
    if (spotEditingCopy.properties.image_basemap) newLine2.properties.image_basemap = spotEditingCopy.properties.image_basemap;
    if (spotEditingCopy.properties.name) newLine2.properties.name = spotEditingCopy.properties.name + ' Split';
    if (spotEditingCopy.properties.notes) newLine2.properties.notes = spotEditingCopy.properties.notes;
    if (spotEditingCopy.properties.notesTimestamp) newLine2.properties.notesTimestamp = spotEditingCopy.properties.notesTimestamp;
    if (spotEditingCopy.properties.strat_section_id) newLine2.properties.strat_section_id = spotEditingCopy.properties.strat_section_id;
    if (spotEditingCopy.properties.symbology) newLine2.properties.symbology = spotEditingCopy.properties.symbology;
    if (spotEditingCopy.properties.time) newLine2.properties.time = spotEditingCopy.properties.time;
    if (spotEditingCopy.properties.trace) newLine2.properties.trace = spotEditingCopy.properties.trace;
    console.log('Split Line 1', newLine1);
    console.log('Split Line 2', newLine2);

    console.log('Edited coords:', turf.getCoords(newLine1));
    let explodedFeatures = turf.explode(newLine1).features;
    explodedFeatures = explodedFeatures.map((feature) => {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          tempEditId: getNewUUID(),
        },
      };
    });
    if (currentImageBasemap || stratSection) {
      newLine1 = convertFeatureGeometryToImagePixels(newLine1);
      newLine2 = convertFeatureGeometryToImagePixels(newLine2);
    }
    const spotsEditedTmp = spotsEdited.filter(
      spotEdited => spotEdited.properties.id !== newLine1.properties.id && spotEdited.properties.id !== newLine2.properties.id);
    spotsEditedTmp.push(...[newLine1, newLine2]);
    const spotsNotEditedTmp = spotsNotEdited.filter(
      spotNotEdited => spotNotEdited.properties.id !== newLine1.properties.id && spotNotEdited.properties.id !== newLine2.properties.id);
    setSpotEditing(newLine1);
    setSpotsEdited(spotsEditedTmp);
    setSpotsNotEdited(spotsNotEditedTmp);
    setDisplayedSpotsWhileEditing(newLine1, spotsEditedTmp, spotsNotEditedTmp);
    console.log('Finished editing Spot. Spot Editing: ', newLine1);
    setDrawFeatures(explodedFeatures);
    // Select the split point (newLine1's new endpoint) right away so it's draggable immediately. Pass it as a
    // name-less point in the Spot's projection so setSelectedVertexToEdit's image-basemap conversion fires.
    const splitVertexIndex = newLine1.geometry.coordinates.length - 1;
    setSelectedVertexToEdit(turf.point([...newLine1.geometry.coordinates[splitVertexIndex]]));
    setVertexIndex(splitVertexIndex);
  };

  const startEditing = (spotToEdit, vertexToEditTemp, index, setMapModeToEdit) => {
    setMapModeToEdit();
    clearEditing();
    const mappedSpots = getAllMappedSpots();
    setSpotEditing(spotToEdit ? spotToEdit : {});
    setSpotsEdited([]);
    setSpotsNotEdited(mappedSpots);
    spotToEdit ? console.log('Set Spot to edit:', spotToEdit) : console.log('No Spot selected to edit.');
    // #114, editing a spot should immediately identify it as the selected spot and hence update the notebook panel.
    setDisplayedSpotsWhileEditing(spotToEdit, [], mappedSpots);
    if (!isEmpty(spotToEdit)) {
      dispatch(setSelectedSpot(spotToEdit));
      setEditFeatures(spotToEdit);
    }
    // while starting to edit the spot, set the vertex active to move immediately, if available
    if (vertexToEditTemp) {
      if (spotToEdit.geometry.type !== 'Point') {
        setSelectedVertexToEdit(vertexToEditTemp);
        setVertexIndex(index);
      }
    }
    if (spotToEdit?.geometry?.type === 'Point') setSelectedVertexToEdit(spotToEdit);
  };

  return {
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
  };
};

export default useMapEditVertex;
