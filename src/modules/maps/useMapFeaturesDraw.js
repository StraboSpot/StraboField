import {useEffect, useState} from 'react';
import {PixelRatio, Platform} from 'react-native';

import * as turf from '@turf/turf';
import proj4 from 'proj4';
import {useDispatch, useSelector} from 'react-redux';

import {GEO_LAT_LNG_PROJECTION, MAP_MODES, PIXEL_PROJECTION} from './maps.constants';
import {addVertexToLine, addVertexToPolygon} from './maps.helpers';
import {clearedVertexes, setFreehandFeatureCoords, setVertexStartCoords} from './maps.slice';
import useMapSymbology from './symbology/useMapSymbology';
import useMap from './useMap';
import useMapCoords from './useMapCoords';
import useMapFeatures from './useMapFeatures';
import useMapFeaturesCalculated from './useMapFeaturesCalculated';
import useStereonet from './useStereonet';
import {getNewId, getNewUUID, isEmpty, isEqual} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import {setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/pageKeys.constants';
import {addedNewSpotIdsToDataset, updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import useProject from '../project/useProject';
import {
  clearedSelectedSpots,
  editedOrCreatedSpots,
  setIntersectedSpotsForTagging,
  setSelectedSpot,
} from '../spots/spots.slice';
import useSpots from '../spots/useSpots';

const useMapFeaturesDraw = ({
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
  const freehandFeatureCoords = useSelector(state => state.map.freehandFeatureCoords);
  const geometryTypesOff = useSelector(state => state.map.geometryTypesOff) || [];
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);
  const stratSection = useSelector(state => state.map.stratSection);
  const vertexEndCoords = useSelector(state => state.map.vertexEndCoords);

  const {isDrawMode} = useMap();
  const {convertFeatureGeometryToImagePixels, convertImagePixelsToLatLong} = useMapCoords();
  const {getAllMappedSpots, getDisplayedSpots} = useMapFeatures();
  const {
    getDrawFeatureAtPress, getLassoedSpots, getSpotAtPress, identifyClosestVertexOnSpotPress,
  } = useMapFeaturesCalculated(mapRef);
  const {getSymbology} = useMapSymbology();
  const {getTargetDatasetFromId, isSpotInReadOnlyDataset} = useProject();
  const {createSpot} = useSpots();
  const {getStereonet} = useStereonet();

  /* Local State */

  const [allowMapViewMove, setAllowMapViewMove] = useState(true); // VIEW mode (initial) allows map movement
  const [drawFeatures, setDrawFeatures] = useState([]);
  const [editFeatureVertex, setEditFeatureVertex] = useState([]);
  const [spotEditing, setSpotEditing] = useState({});
  const [spotsEdited, setSpotsEdited] = useState([]);
  const [spotsNotEdited, setSpotsNotEdited] = useState([]);
  const [spotsNotSelected, setSpotsNotSelected] = useState([]);
  const [spotsSelected, setSpotsSelected] = useState([]);
  const [vertexIndex, setVertexIndex] = useState([]);
  const [vertexToEdit, setVertexToEdit] = useState([]);

  /* Side Effects */

  useEffect(() => {
    // console.log('UE useMapFeaturesDraw [mapMode]');
    setAllowMapViewMove(!(isDrawMode(mapMode) || mapMode === MAP_MODES.EDIT));
  }, [mapMode]);

  useEffect(() => {
    // console.log('UE useMapFeaturesDraw [drawFeatures]');
    if ((mapMode === MAP_MODES.DRAW.POINT) && drawFeatures.length === 1) onEndDrawPressed();
  }, [drawFeatures]);

  useEffect(() => {
    // console.log('UE useMapFeaturesDraw [vertexEndCoords]');
    if (!isEmpty(vertexEndCoords && mapMode === MAP_MODES.EDIT)) moveVertex();
  }, [vertexEndCoords]);

  useEffect(() => {
    // console.log(
    //   'UE useMapFeaturesDraw [spots, datasets, currentBasemap, currentImageBasemap, stratSection, featureTypesOff, geometryTypesOff]');
    setDisplayedSpots((isEmpty(selectedSpot) ? [] : [{...selectedSpot}]));
  }, [spots, datasets, currentBasemap, currentImageBasemap, featureTypesOff, geometryTypesOff, stratSection]);

  useEffect(() => {
    // console.log('UE useMapFeaturesDraw [selectedSpot, activeDatasetsIds]');
    //conditional call to avoid multiple renders during edit mode.
    if (mapMode !== MAP_MODES.EDIT) setDisplayedSpots((isEmpty(selectedSpot) ? [] : [{...selectedSpot}]));
  }, [selectedSpot, activeDatasetsIds]);

  /* Internal Functions */

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
    setDrawFeatures([]);
    clearSelectedVertexToEdit();                        // Not really needed here?
    console.log('Cleared selected Spot.');
  };

  const clearSelectedSpotsWhileEditing = () => {
    console.log('Clear selected Spots.');
    setDisplayedSpotsWhileEditing([], spotsEdited, spotsNotEdited);
    dispatch(clearedSelectedSpots());
  };

  const clearSelectedVertexToEdit = () => {
    setVertexToEdit({});
    setEditFeatureVertex([]);
    setAllowMapViewMove(true);
    console.log('Cleared selected vertex to edit.');
    //if (turf.getType(spotsEditing[0]) === 'Point') clearSelectedFeatureToEdit();
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

  const getFeatureWithNewVertex = (e, spotEditingCopy) => {
    const newVertexCoords = Platform.OS === 'web' ? [e.lngLat.lng, e.lngLat.lat] : turf.getCoord(e);
    const newVertex = turf.point(newVertexCoords);
    return turf.getType(spotEditingCopy) === 'LineString' ? addVertexToLine(spotEditingCopy, newVertex)
      : addVertexToPolygon(spotEditingCopy, newVertex);
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

  const getStereonetForFeature = async (feature) => {
    const selectedSpots = getLassoedSpots(spotsNotSelected, feature);
    console.log('Selected Spots', selectedSpots);
    await getStereonet(selectedSpots);
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
    return indexOfCoordinatesToUpdate;
  };

  const selectReports = (feature) => {
    const selectedSpots = getLassoedSpots(spotsNotSelected, feature);
    if (selectedSpots.length > 0) {
      dispatch(setIntersectedSpotsForTagging(selectedSpots));
      dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.ADD_SPOTS_TO_REPORTS}));
    }
    else {
      alert(
        'Error!',
        'No Spots selected.',
      );
    }
  };

  const selectSpotsForQAQC = (feature) => {
    let selectedSpots = [];
    selectedSpots = getLassoedSpots(spotsNotSelected, feature);
    console.log('Selected Spots', selectedSpots);
    if (selectedSpots.length > 0) {
      dispatch(setIntersectedSpotsForTagging(selectedSpots));
      dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.ADD_SPOTS_TO_QAQC}));
    }
    else console.warn('No Spots selected.');
  };

  const selectSpotsForTagging = (feature) => {
    const selectedSpots = getLassoedSpots(spotsNotSelected, feature);

    // Filter out Read Only Spots
    const selectedSpotsFiltered = selectedSpots.filter((spot) => {
      if (spot?.properties?.id && !isSpotInReadOnlyDataset(spot.properties.id)) return spot;
    });

    if (selectedSpotsFiltered.length > 0) {
      dispatch(setIntersectedSpotsForTagging(selectedSpotsFiltered));
      dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.ADD_TAGS_TO_SPOTS}));
    }
    else if (selectedSpots.length > 0) {
      alert(
        'Error!',
        'Only Read Only Spots Selected',
      );
    }
    else {
      alert(
        'Error!',
        'No Spots Selected',
      );
    }
  };

  // Set selected and not selected Spots to display when not editing
  const setDisplayedSpots = (selectedSpots) => {
    let [selectedDisplayedSpots, notSelectedDisplayedSpots] = getDisplayedSpots(selectedSpots);

    // Convert image pixels to lat, lng (deep copy first to avoid mutating Redux state)
    if (currentImageBasemap || stratSection) {
      selectedDisplayedSpots = JSON.parse(JSON.stringify(selectedDisplayedSpots)).map(
        spot => convertImagePixelsToLatLong(spot));
      notSelectedDisplayedSpots = JSON.parse(JSON.stringify(notSelectedDisplayedSpots)).map(
        spot => convertImagePixelsToLatLong(spot));
    }

    if (!isEqual(spotsSelected, selectedDisplayedSpots)) {
      console.log('Selected Spots:', selectedDisplayedSpots);
      setSpotsSelected(selectedDisplayedSpots);
    }
    if (!isEqual(spotsNotSelected, notSelectedDisplayedSpots)) {
      console.log('Not Selected Spots:', notSelectedDisplayedSpots);
      setSpotsNotSelected(notSelectedDisplayedSpots);
    }
  };

  // Set selected and not selected Spots to display while editing
  const setDisplayedSpotsWhileEditing = (spotEditingTmp, spotsEditedTmp, spotsNotEditedTmp) => {
    if (!isEmpty(spotEditingTmp)) {
      spotsNotEditedTmp = spotsNotEditedTmp.filter(spot => spot.properties.id !== spotEditingTmp.properties.id);
    }
    console.log('Set displayed Spots while editing. Editing:', spotEditingTmp, 'Edited:', spotsEditedTmp, 'Not edited:',
      spotsNotEditedTmp);

    let spotsEditedCopy = JSON.parse(JSON.stringify(isEmpty(spotsEditedTmp) ? [] : spotsEditedTmp));
    let spotsNotEditedCopy = JSON.parse(JSON.stringify(isEmpty(spotsNotEditedTmp) ? [] : spotsNotEditedTmp));
    let spotEditingCopy = JSON.parse(JSON.stringify(isEmpty(spotEditingTmp) ? [] : [{...spotEditingTmp}]));

    // Convert image pixels to lat, lng
    if (currentImageBasemap || stratSection) {
      spotsEditedCopy = spotsEditedCopy.map(spot => convertImagePixelsToLatLong(spot));
      spotsNotEditedCopy = spotsNotEditedCopy.map(spot => convertImagePixelsToLatLong(spot));
      spotEditingCopy = spotEditingCopy.map(spot => convertImagePixelsToLatLong(spot));
    }

    console.log('Selected Edit Features:', spotEditingCopy);
    setSpotsSelected(isEmpty(spotEditingCopy) ? [] : spotEditingCopy);
    console.log('Unselected Edit Features:', [...spotsEditedCopy, ...spotsNotEditedCopy]);
    setSpotsNotSelected([...spotsEditedCopy, ...spotsNotEditedCopy]);
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

  const setSelectedSpotToEdit = (spotToEdit) => {
    console.log('setSelectedSpotToEdit spotToEdit', spotToEdit);
    setSpotEditing(spotToEdit);
    console.log('Set selected Spot to edit:', spotToEdit);
    setDisplayedSpotsWhileEditing(spotToEdit, spotsEdited, spotsNotEdited);
    setEditFeatures(spotToEdit);
    if (turf.getType(spotToEdit) === 'Point') setSelectedVertexToEdit(spotToEdit);
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
  };

  const cancelDraw = () => {
    setDrawFeatures([]);
    console.log('Draw canceled.');
  };

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

  const clearVertexes = () => dispatch(clearedVertexes());

  const deleteSelectedVertex = (spotEditingCopy, vertexSelected) => {
    console.log('Deleting selected vertex...');
    const coords = turf.getCoords(spotEditingCopy);
    const indexOfCoordinatesToUpdate = getVertexIndexInSpotToEdit(vertexSelected);
    let isModified = false;
    if (turf.getType(spotEditingCopy) === 'LineString' && coords.length > 2) {
      for (let i = 0; i < coords.length; i++) {
        if (indexOfCoordinatesToUpdate.includes(i)) {
          spotEditingCopy.geometry.coordinates.splice(i, 1);
          isModified = true;
        }
      }
    }
    else if (turf.getType(spotEditingCopy) === 'Polygon' && coords[0].length > 4) {
      for (let i = 0; i < coords.length; i++) {
        for (let j = 0; j < coords[i].length; j++) {
          if (indexOfCoordinatesToUpdate.includes(j)) {
            spotEditingCopy.geometry.coordinates[i].splice(j, 1);
            isModified = true;
          }
        }
      }
      if (indexOfCoordinatesToUpdate.includes(0)) {
        // when the first spot is deleted, update the last spot to the current first spot.
        spotEditingCopy.geometry.coordinates[0][spotEditingCopy.geometry.coordinates[0].length - 1] = spotEditingCopy.geometry.coordinates[0][0];
      }
    }
    else console.log('Not enough vertices in selected feature to delete one.');
    if (isModified) {
      spotEditingCopy.properties.modified_timestamp = Date.now();
      console.log('Finished deleting vertex. Edited Spot:', spotEditingCopy);
    }
    else console.warn('Problem editing Spot');
    getSpotToEditCont(spotEditingCopy);
  };

  const editSpot = async (e) => {
    // Select/Unselect new vertex to edit
    const [screenPointX, screenPointY] = Platform.OS === 'web' ? [e.point.x, e.point.y]
      : Platform.OS === 'android' ? [e.properties.screenPointX / PixelRatio.get(), e.properties.screenPointY / PixelRatio.get()]
        : [e.properties.screenPointX, e.properties.screenPointY];
    console.log('Select/Unselect vertex (and thus feature with the vertex) to edit');
    console.log('Selecting feature to edit...');

    // If we don't have a selected feature, check to see if point pressed was at a feature
    //   If not, do nothing
    //   If so, set that feature to the selected feature and set all other features as features-not-selected and
    //   explode the vertices of the selected feature if the feature is a line or polygon and add to draw layer
    // If we already have a selected feature check to see if we also already have a selected vertex
    // If not, and there is a different feature at the point pressed, set that feature as the selected feature
    // If not, and there is a vertex of the selected feature at the point pressed, set that as the selected vertex
    // If not, and there is no feature at the point pressed, unselect the selected feature
    // If so, check to see if point pressed was at another vertex of the selected feature
    //     If not edit vertex coords to those of pressed point
    //     If so switch selected vertex to vertex at pressed point
    const spotAtPress = await getSpotAtPress(screenPointX, screenPointY);
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

  const endDraw = async () => {
    let newOrEditedSpot = {};
    if (mapMode === MAP_MODES.DRAW.FREEHANDPOLYGON || mapMode === MAP_MODES.DRAW.FREEHANDLINE) {
      if (freehandFeatureCoords && freehandFeatureCoords.length > 2) {
        let screenCoordinates = freehandFeatureCoords;
        let featureCoordinates = [];
        let screenX, screenY = 0;
        for (let i = 0; i < screenCoordinates.length; i++) {
          screenX = screenCoordinates[i][0];
          screenY = screenCoordinates[i][1];
          let geoCoordinates = Platform.OS === 'web' ? mapRef.current.unproject([screenX, screenY]).toArray()
            : await mapRef.current.getCoordinateFromView([screenX, screenY]);
          featureCoordinates.push(geoCoordinates);
        }
        let feature = {};
        if (mapMode === MAP_MODES.DRAW.FREEHANDPOLYGON) {
          featureCoordinates.push(featureCoordinates[0]); // First and Last coordinates of polygon should match
          feature = turf.polygon([featureCoordinates]);
        }
        else feature = turf.lineString(featureCoordinates);
        if (currentImageBasemap) { //create new spot for imagebasemap - needs lat long to pixel conversion
          feature = convertFeatureGeometryToImagePixels(feature);
          feature.properties.image_basemap = currentImageBasemap.id;
        }
        else if (stratSection) { //create new spot for strat section - needs lat long to pixel conversion
          feature = convertFeatureGeometryToImagePixels(feature);
          feature.properties.strat_section_id = stratSection.strat_section_id;
        }
        if (selectingMode === 'report') selectReports(feature);
        else if (selectingMode === 'stereonet') await getStereonetForFeature(feature);
        else if (selectingMode === 'selectSpots') selectSpotsForQAQC(feature);
        else if (selectingMode === 'tag') selectSpotsForTagging(feature);
        else {
          feature.properties.symbology = getSymbology(feature);
          newOrEditedSpot = await createSpot(feature);
          dispatch(setSelectedSpot(newOrEditedSpot));
          dispatch(setFreehandFeatureCoords(undefined));  // reset the freeHandCoordinates
        }
      }
    }
    else if (!isEmpty(drawFeatures)) {
      let newFeature = drawFeatures[0];  // If one draw feature the Spot is just a point
      // If there is more than one draw feature (should be no more than three) the first is the first vertex
      // placed, the second is the line or polygon between the vertices, and the third is the last vertex placed
      // Grab the second feature to create the Spot
      if (drawFeatures.length > 1) newFeature = drawFeatures.splice(1, 1)[0];
      newFeature.properties.symbology = getSymbology(newFeature);
      if (currentImageBasemap) { //create new spot for imagebasemap - needs lat long to pixel conversion
        newFeature = convertFeatureGeometryToImagePixels(newFeature);
        newFeature.properties.image_basemap = currentImageBasemap.id;
      }
      else if (stratSection) { //create new spot for imagebasemap - needs lat long to pixel conversion
        newFeature = convertFeatureGeometryToImagePixels(newFeature);
        newFeature.properties.strat_section_id = stratSection.strat_section_id;
      }
      if (selectingMode === 'report') selectReports(newFeature);
      else if (selectingMode === 'stereonet') await getStereonetForFeature(newFeature);
      else if (selectingMode === 'tag') selectSpotsForTagging(newFeature);
      else {
        newOrEditedSpot = await createSpot(newFeature);
        dispatch(setSelectedSpot(newOrEditedSpot));
      }
      setDrawFeatures([]);
    }
    console.log('Draw ended.');
    dispatch(setFreehandFeatureCoords(undefined));  // reset the freeHandCoordinates
    return Promise.resolve(newOrEditedSpot);
  };

  const getSpotToEdit = async (e, screenPointX, screenPointY, spotToEdit) => {
    if (isEmpty(spotToEdit)) console.log('Already in editing mode and no Spot found where pressed. No action taken.');
    else if (!isEmpty(spotEditing)) {
      let spotEditingCopy = JSON.parse(JSON.stringify(spotEditing));
      if (turf.getType(spotEditingCopy) === 'LineString' || turf.getType(spotEditingCopy) === 'Polygon') {
        const vertexSelected = await getDrawFeatureAtPress(screenPointX, screenPointY);
        if (spotEditingCopy.properties.id === spotToEdit.properties.id) {
          if (turf.getType(spotEditingCopy) === 'LineString') {
            setVertexActionValues({
              e: e,
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
      console.log('Problem moving the vertex');
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
      dispatch(addedNewSpotIdsToDataset({datasetId: targetDataset.id, spotIds: spotIds}));
      dispatch(updatedModifiedTimestampsBySpotsIds(spotIds));
      dispatch(editedOrCreatedSpots(spotsEdited));
    }
    clearEditing();
  };

  const setDrawFeaturesNew = (e) => {
    console.log('Drawing', mapMode, '...');
    let feature = {};
    const newCoord = Platform.OS === 'web' ? [e.lngLat.lng, e.lngLat.lat] : turf.getCoord(e);
    // Draw a point for the last coordinate touched
    // const lastVertexPlaced = MapboxGL.geoUtils.makeFeature(e.geometry);
    const lastVertexPlaced = turf.point(newCoord);
    // Draw a point (if set point to current location not working)
    if (mapMode === MAP_MODES.DRAW.POINT) setDrawFeatures([lastVertexPlaced]);
    else if (isEmpty(drawFeatures)) setDrawFeatures([lastVertexPlaced]);
    // Draw a line given a point and a new point
    else if (drawFeatures.length === 1) {
      const firstVertexPlaced = drawFeatures[0];
      const firstVertexPlacedCoords = turf.getCoords(firstVertexPlaced);
      feature = turf.lineString([firstVertexPlacedCoords, newCoord]);
      setDrawFeatures([firstVertexPlaced, feature, lastVertexPlaced]);
    }
    // Draw a line given a line and a new point
    else if (drawFeatures.length > 1 && mapMode === MAP_MODES.DRAW.LINE) {
      const firstVertexPlaced = drawFeatures[0];
      const lineCoords = turf.getCoords(drawFeatures[1]);
      feature = turf.lineString([...lineCoords, newCoord]);
      setDrawFeatures([firstVertexPlaced, feature, lastVertexPlaced]);
    }
    else if (drawFeatures.length > 1 && mapMode === MAP_MODES.DRAW.POLYGON) {
      const firstVertexPlaced = drawFeatures[0];
      const firstVertexPlacedCoords = turf.getCoords(firstVertexPlaced);

      // Draw a polygon given a line and a new point
      if (turf.getType(drawFeatures[1]) === 'LineString') {
        const lineCoords = turf.getCoords(drawFeatures[1]);
        feature = turf.polygon([[...lineCoords, newCoord, firstVertexPlacedCoords]]);
      }
      // Draw a polygon given a polygon and a new point
      else {
        let polyCoords = turf.getCoords(drawFeatures[1])[0];
        polyCoords.pop();
        feature = turf.polygon([[...polyCoords, newCoord, firstVertexPlacedCoords]]);
      }
      setDrawFeatures([firstVertexPlaced, feature, lastVertexPlaced]);
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
    const lineCoords = turf.getCoords(spotEditingCopy);
    const endCoords1 = lineCoords[0];
    const endCoords2 = lineCoords[lineCoords.length - 1];
    const endPoint1 = turf.point(endCoords1);
    const endPoint2 = turf.point(endCoords2);
    const lineSplitTemp1 = turf.lineSlice(endPoint1, vertexAdded, spotEditingCopy);
    const lineSplitTemp2 = turf.lineSlice(vertexAdded, endPoint2, spotEditingCopy);
    const lineSplit1 = turf.cleanCoords(lineSplitTemp1);
    const lineSplit2 = turf.cleanCoords(lineSplitTemp2);
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
    clearSelectedVertexToEdit();
    console.log('Finished editing Spot. Spot Editing: ', newLine1);
    setDrawFeatures(explodedFeatures);
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
    getSpotToEdit,
    moveVertex,
    saveEdits,
    setDrawFeaturesNew,
    splitLine,
    spotsNotSelected,
    spotsSelected,
    startEditing,
    switchToEditing,
  };
};

export default useMapFeaturesDraw;
