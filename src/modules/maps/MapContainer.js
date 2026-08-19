import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Platform, View} from 'react-native';

import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import useCustomMap from './custom-maps/useCustomMap';
import SelectSpotsAtPressModal from './editing/SelectSpotsAtPressModal';
import SetInCurrentViewOverlay from './editing/SetInCurrentViewOverlay';
import useMapEditor from './editing/useMapEditor';
import VertexActionsOverlay from './editing/VertexActionsOverlay';
import useMapFeaturesCalculated from './features/useMapFeaturesCalculated';
import useMapPressEvents from './interactions/useMapPressEvents';
import MacrostratOverlay from './macrostrat/MacrostratOverlay';
import Map from './Map';
import {SPOTS_EXTENT_ZOOM_DELAY, ZOOM} from './maps.constants';
import {setSpotsInMapExtentIds} from './maps.slice';
import useMapsOffline from './offline-maps/useMapsOffline';
import useMap from './useMap';
import useMapCoords from './view/useMapCoords';
import useMapLocation from './view/useMapLocation';
import useMapView from './view/useMapView';
import useServerRequests from '../../services/network/useServerRequests';
import {isEmpty} from '../../shared/helpers';
import {openedMessageModal} from '../home/home.slice';
import useImageSize from '../images/useImageSize';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpot} from '../spots/spots.slice';

const MapContainer = forwardRef(({
                                   mapMode,
                                   onEndDrawPressed,
                                   selectingMode,
                                   setDistance,
                                   setMapModeToEdit,
                                 }, mapComponentRef) => {
  console.log('Rendering MapContainer...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const customBasemap = useSelector(state => state.map.customMaps);
  const intervalDragState = useSelector(state => state.map.intervalDragState);
  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const isMapExtentFilterActive = useSelector(state => state.map.isMapExtentFilterActive);
  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const isStatusMessagesModalVisible = useSelector(state => state.home.isStatusMessagesModalVisible);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const stratSection = useSelector(state => state.map.stratSection);
  const userEmail = useSelector(state => state.user.email);

  const {setCustomMapSwitchValue} = useCustomMap();
  const {setImageHeightAndWidth} = useImageSize();
  const {getExtentAndZoomCall, setBasemap} = useMap();
  const {convertFeatureGeometryToImagePixels} = useMapCoords();
  const mapRef = useRef(null);
  const {getSpotsInBoundingBox} = useMapFeaturesCalculated(mapRef);
  const [isShowVertexActionsModal, setIsShowVertexActionsModal] = useState(false);
  const [vertexActionValues, setVertexActionValues] = useState(null);
  const {
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
    isEditingSpot,
    moveVertex,
    saveEdits,
    setDrawFeaturesNew,
    setSpotToEditFromPicker,
    splitLine,
    spotsNotSelected,
    spotsSelected,
    startEditing,
    switchToEditing,
  } = useMapEditor({
    mapMode: mapMode,
    mapRef: mapRef,
    onEndDrawPressed: onEndDrawPressed,
    selectingMode: selectingMode,
    setIsShowVertexActionsModal: setIsShowVertexActionsModal,
    setVertexActionValues: setVertexActionValues,
  });
  const {getCurrentLocation} = useMapLocation();
  const [isShowMacrostratOverlay, setIsShowMacrostratOverlay] = useState(false);
  const [isShowSpotsAtPressModal, setIsShowSpotsAtPressModal] = useState(false);
  const [measureFeatures, setMeasureFeatures] = useState([]);
  const [spotsAtPress, setSpotsAtPress] = useState([]);
  const {
    handleMapLongPress,
    handleMapPress,
    handleSpotAtPressSelected,
    isSpotsAtPressForEdit,
    location,
    startIntervalDrag,
  } = useMapPressEvents({
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
  });
  const {getMapCenterTile, switchToOfflineMap} = useMapsOffline();
  const {setMapView, zoomToSpotsNow} = useMapView();
  const {getTilesFromHost} = useServerRequests();

  /* Local State */

  const cameraRef = useRef(null);
  const isDatasetToggleZoomPendingRef = useRef(false);
  const isInitialLoadZoomPendingRef = useRef(false);
  // Mirror the map-extent-filter flag in a ref so the debounced map-move callback reads the latest value.
  const isMapExtentFilterActiveRef = useRef(isMapExtentFilterActive);
  const spotsRef = useRef(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isZoomToCenterOffline, setIsZoomToCenterOffline] = useState(false);
  const [showSetInCurrentViewModal, setShowSetInCurrentViewModal] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);

  /* Derived State */

  const cameraRefCallback = useCallback((node) => {
    cameraRef.current = node;
    setIsCameraReady(node !== null);
  }, []);

  /* Side Effects */

  useEffect(() => {
    // console.log('UE MapContainer [featuresSelected, featuresUnselected]');
    spotsRef.current = [...spotsSelected, ...spotsNotSelected];
    if (isDatasetToggleZoomPendingRef.current) {
      isDatasetToggleZoomPendingRef.current = false;
      isInitialLoadZoomPendingRef.current = false;
      if (spotsRef.current.length > 0) zoomToSpotsExtent().catch(console.error);
    }
    else if (isInitialLoadZoomPendingRef.current) {
      isInitialLoadZoomPendingRef.current = false;
      if (spotsRef.current.length > 0) zoomToSpotsExtent().catch(console.error);
    }
  }, [spotsSelected, spotsNotSelected]);

  useEffect(() => {
    if (isProjectLoadSelectionModalVisible) {
      if (Platform.OS === 'web') isInitialLoadZoomPendingRef.current = true;
      else if (spotsRef.current?.length > 0) zoomToSpotsExtent().catch(console.error);
      else isInitialLoadZoomPendingRef.current = true;
    }
  }, [isProjectLoadSelectionModalVisible]);

  useEffect(() => {
    if (isStatusMessagesModalVisible) isDatasetToggleZoomPendingRef.current = true;
  }, [activeDatasetsIds]);

  // Retry zoom once the Mapbox camera mounts after a project load
  useEffect(() => {
    if (isCameraReady && spotsRef.current?.length > 0
      && (isInitialLoadZoomPendingRef.current || isDatasetToggleZoomPendingRef.current)) {
      isInitialLoadZoomPendingRef.current = false;
      isDatasetToggleZoomPendingRef.current = false;
      zoomToSpotsExtent().catch(console.error);
    }
  }, [isCameraReady]);

  useEffect(() => {
    // console.log('UE MapContainer [currentImageBasemap]');
    if (currentImageBasemap && (!currentImageBasemap.height || !currentImageBasemap.width)) {
      setImageHeightAndWidth(currentImageBasemap).catch(console.error);
    }
  }, [currentImageBasemap]);

  // Recompute the Spots in the map extent whenever a map-extent list (Spots/Images/Samples/Tags/
  // Geologic Units) becomes active, so it is current when the view opens or the map regains focus.
  useEffect(() => {
    isMapExtentFilterActiveRef.current = isMapExtentFilterActive;
    if (isMapExtentFilterActive) updateSpotsInMapExtent().catch(console.error);
  }, [isMapExtentFilterActive]);

  useEffect(() => {
    // console.log('UE MapContainer [currentBasemap, isZoomToCenterOffline]');
    updateMapView().catch(err => console.warn('Error getting center of custom map:', err));
    if (currentBasemap?.source !== 'macrostrat') setIsShowMacrostratOverlay(false);
  }, [currentBasemap, isZoomToCenterOffline]);

  useEffect(() => {
    if (isDragIntervalMode && stratSection) {
      const interval = selectedSpot?.properties?.surface_feature?.surface_feature_type === 'strat_interval'
        ? selectedSpot
        : null;
      startIntervalDrag(0, 0, interval, 0).catch(console.error);
    }
  }, [isDragIntervalMode]);

  useEffect(() => {
    if (!intervalDragState && isDragIntervalMode && stratSection) {
      const interval = selectedSpot?.properties?.surface_feature?.surface_feature_type === 'strat_interval'
        ? selectedSpot
        : null;
      startIntervalDrag(0, 0, interval, 0).catch(console.error);
    }
  }, [intervalDragState]);

  useEffect(() => {
    // console.log('UE MapContainer [userEmail, isOnline]');
    if (isOnline) {
      if (!currentBasemap) setBasemap().catch(console.error);
      // Custom basemaps: rebuild (URL may need rebuilding) and surface a fallback if it fails.
      else if (customBasemap[currentBasemap.id]) {
        setBasemap(currentBasemap.id).catch((error) => {
          console.log('Error Setting Basemap', error);
          dispatch(openedMessageModal({
            message: `Setting basemap to Mapbox Topo.\n\n${error}`,
            title: 'Error Setting Custom Basemap!',
          }));
        });
      }
        // Standard basemaps: the persisted object carries baked-in derived fields — notably an absolute
        // file:// glyphs path — that go stale when the app's container path changes across installs/updates,
      // making the style fail to load so Spot layers never attach. Rebuild from current runtime. Issue #919.
      else setBasemap(currentBasemap.id).catch(console.error);
    }
    else if (isOnline === false && currentBasemap && Platform.OS !== 'web') {
      Object.values(customBasemap).forEach((map) => {
        if (offlineMaps[map.id]?.id !== map.id) setCustomMapSwitchValue(false, map);
      });
      switchToOfflineMap().catch(error => console.log('Error Setting Offline Basemap', error));
    }
    clearVertexes();
  }, [userEmail, isOnline]);

  useImperativeHandle(mapComponentRef, () => {
    return {
      cancelDraw: cancelDraw,
      cancelEdits: cancelEdits,
      clearSelectedSpots: clearSelectedSpots,
      createDefaultGeom: createDefaultGeom,
      endDraw: endDraw,
      endMapMeasurement: endMapMeasurement,
      getCurrentZoom: getCurrentZoom,
      getExtentString: getExtentString,
      getTileCount: getTileCount,
      moveVertex: moveVertex,
      saveEdits: saveEdits,
      startEditingMode: startEditingMode,
      toggleUserLocation: toggleUserLocation,
      zoomToCenterOfflineTile: zoomToCenterOfflineTile,
      zoomToCurrentLocation: zoomToCurrentLocation,
      zoomToCustomMap: zoomToCustomMap,
      zoomToSpots: zoomToSpots,
      zoomToSpotsExtent: zoomToSpotsExtent,
    };
  });

  /* Event Handlers */

  const handleMapLoadedWeb = () => {
    if (isInitialLoadZoomPendingRef.current && spotsRef.current?.length > 0) {
      isInitialLoadZoomPendingRef.current = false;
      zoomToSpotsExtent().catch(console.error);
    }
  };

  /* Logic Helpers */

  // Create a default geometry for a Spot that doesn't have geometry when 'Set in Current View' is clicked,
  // then make it selected for immediate editing
  const createDefaultGeom = async () => {
    if (selectedSpot && selectedSpot.properties && mapRef && mapRef.current) {
      if (selectedSpot.properties.trace) createDefaultGeomContinued('LineString');
      else if (selectedSpot.properties.surface_feature) createDefaultGeomContinued('Polygon');
      else setShowSetInCurrentViewModal(true);
    }
    else console.warn('Error creating a default geometry as there is no map or Selected Spot');
  };

  const createDefaultGeomContinued = async (defaultGeomType) => {
    let centerCoords = Platform.OS === 'web' ? await mapRef.current.getCenter().toArray()
      : await mapRef.current.getCenter();
    if (centerCoords) {
      let defaultFeature = turf.point(centerCoords);
      if (defaultGeomType === 'LineString' || defaultGeomType === 'Polygon') {
        const centerArea = turf.buffer(defaultFeature, 0.25, {units: 'miles'});
        defaultFeature = turf.bboxPolygon(turf.bbox(centerArea));
        if (defaultGeomType === 'LineString') {
          const defaultFeatureCoords = turf.getCoords(defaultFeature);
          defaultFeature = turf.lineString([defaultFeatureCoords[0][0], defaultFeatureCoords[0][2]]);
        }
      }
      // copy spot for image basemaps needs conversion of coordinates.
      if (currentImageBasemap || stratSection) defaultFeature = convertFeatureGeometryToImagePixels(defaultFeature);
      const selectedSpotCopy = {...selectedSpot, geometry: defaultFeature.geometry};
      dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpotCopy.properties.id]));
      dispatch(editedOrCreatedSpot(selectedSpotCopy));

      // Set new geometry ready for editing, set the active vertex to first index of the geometry.
      startEditing(selectedSpotCopy, turf.explode(selectedSpotCopy).features[0], 0, setMapModeToEdit);
    }
    else console.warn('Error getting the center of the map');
  };

  const endMapMeasurement = () => {
    setDistance(0);
    setMeasureFeatures([]);
  };

  const getCurrentZoom = async () => {
    //console.log('Map.current', map);
    return await mapRef.current.getZoom();
    // return 16;
  };

  const getExtentString = async () => {
    const mapBounds = Platform.OS === 'web' ? await mapRef.current.getBounds().toArray()
      : await mapRef.current.getVisibleBounds();

    let right = mapBounds[0][0];
    let top = mapBounds[0][1];
    let left = mapBounds[1][0];
    let bottom = mapBounds[1][1];
    return left + ',' + bottom + ',' + right + ',' + top;
  };

  const getTileCount = async (zoomLevel) => {
    const extentString = await getExtentString();
    try {
      //Assign the promise unresolved first then get the data using the JSON method.
      console.log('sending this extent to server: ', extentString);
      console.log('sending zoom to server: ', zoomLevel);
      const tileCallURL = getExtentAndZoomCall(extentString, zoomLevel);
      const tileCountThisScope = await getTilesFromHost(tileCallURL);
      console.log('got count from server: ', tileCountThisScope);
      return tileCountThisScope;
    }
    catch (err) {
      // Return an error-shaped result so SaveMapsModal can show it inline. Do NOT close the offline
      // modal and open the global MessageModal here: dismissing one native Modal while presenting another
      // in the same commit makes iOS drop the MessageModal presentation and freezes the app.
      console.error(err);
      return {
        message: 'Error fetching data from tile count service. '
          + 'Make sure you are pulling from the correct endpoint (Home → Miscellaneous → Custom Database Endpoint).',
      };
    }
  };

  const startEditingMode = () => {
    startEditing(undefined, undefined, undefined, setMapModeToEdit);
  };

  const toggleUserLocation = (value) => {
    setShowUserLocation(value);
  };

  const updateMapView = async () => {
    // console.log('Updating map view from Map.js');
    if (isEmpty(currentBasemap)) await setBasemap();
    else if (isZoomToCenterOffline) {
      const newCenter = await getMapCenterTile(currentBasemap.id);
      const newZoom = 12;
      setMapView(newCenter, newZoom);
      setIsZoomToCenterOffline(false);
    }
  };

  // Calculate the Spots in the current map extent and send to redux. Skips the work unless a
  // map-extent list is actually being viewed (auto-triggered on map move and on view open).
  const updateSpotsInMapExtent = async () => {
    if (!isMapExtentFilterActiveRef.current) return;
    if (mapRef && mapRef.current) {
      console.log('Updating spots in map extent...');
      let mapBounds;
      if (Platform.OS === 'web') {
        // Derive the extent from the actual rendered container corners instead of getBounds(), which
        // on web is translated/undersized when the map has camera padding or a stale internal size.
        // resize() first syncs the transform to the real container so the unprojected corners match
        // exactly what is on screen.
        const map = mapRef.current;
        if (typeof map.resize === 'function') map.resize();
        const canvas = map.getCanvas();
        const nw = map.unproject([0, 0]);
        const se = map.unproject([canvas.clientWidth, canvas.clientHeight]);
        mapBounds = [[nw.lng, nw.lat], [se.lng, se.lat]];
      }
      else mapBounds = await mapRef.current.getVisibleBounds();
      let right = mapBounds[0][0];
      let top = mapBounds[0][1];
      let left = mapBounds[1][0];
      let bottom = mapBounds[1][1];
      let bbox = [left, bottom, right, top];
      const gotSpotsInMapExtent = getSpotsInBoundingBox(spotsRef.current, bbox);
      const gotSpotsInMapExtentIds = gotSpotsInMapExtent.map(spot => spot.properties.id);
      dispatch(setSpotsInMapExtentIds(gotSpotsInMapExtentIds));
    }
  };

  const zoomToCenterOfflineTile = () => {
    setIsZoomToCenterOffline(true);
  };

  // Fly the map to the current location
  const zoomToCurrentLocation = async () => {
    if (Platform.OS !== 'web' && !cameraRef.current) throw 'Error Getting Map Camera';
    console.log('%cFlying to location', 'color: red');
    const currentLocation = await getCurrentLocation();
    const center = [currentLocation.longitude, currentLocation.latitude];
    const currentZoom = await mapRef.current?.getZoom() || ZOOM;
    const newZoom = Math.max(currentZoom, ZOOM);
    if (Platform.OS === 'web') {
      mapRef.current.flyTo({
        animate: true,
        center: center,
        duration: 2000,
        essential: true,
        zoom: newZoom,
      });
    }
    else {
      cameraRef.current.setCamera({
        animationDuration: 2000,
        animationMode: 'easeTo',
        centerCoordinate: center,
        zoomLevel: newZoom,
      });
    }
  };

  const zoomToCustomMap = (bbox, duration) => {
    if (!bbox) {
      console.error('Error: not able to get Custom Map bbox coords...');
      dispatch(openedMessageModal({message: 'Not able to zoom to custom map while offline.', title: 'Error!'}));
      return;
    }
    if (Platform.OS !== 'web' && !cameraRef.current) return;
    const animationDuration = duration;
    const bboxArr = bbox.split(',');
    if (Platform.OS === 'web') {
      mapRef.current?.fitBounds([[Number(bboxArr[0]), Number(bboxArr[1])], [Number(bboxArr[2]), Number(bboxArr[3])]],
        {padding: 100, duration: animationDuration || 1500});
    }
    else {
      cameraRef.current.fitBounds([Number(bboxArr[0]), Number(bboxArr[1])], [Number(bboxArr[2]), Number(bboxArr[3])],
        100, animationDuration || 1500);
    }
  };

  // Zoom map to the extent of given Spots
  const zoomToSpots = (spot) => {
    if (Platform.OS !== 'web' && !cameraRef.current) return;
    zoomToSpotsNow(spot, mapRef.current, cameraRef.current);
  };

  // Zoom map to the extent of the mapped Spots
  const zoomToSpotsExtent = async () => {
    if (Platform.OS === 'web' && !mapRef.current) return;
    if (Platform.OS !== 'web' && !cameraRef.current) {
      // Camera not ready yet; keep pending so the isCameraReady effect retries
      isInitialLoadZoomPendingRef.current = true;
      return;
    }
    const spotsToZoomTo = [...spotsSelected, ...spotsNotSelected];
    if (Platform.OS === 'web') return zoomToSpotsNow(spotsToZoomTo, mapRef.current, cameraRef.current);
    // Native: this runs right as the triggering UI (map menu, project load, dataset toggle)
    // is changing the map's layout. Fitting bounds during that relayout gets dropped on iOS,
    // so wait for the viewport to settle first. See issue #892.
    setTimeout(
      () => zoomToSpotsNow(spotsToZoomTo, mapRef.current, cameraRef.current).catch(console.error),
      SPOTS_EXTENT_ZOOM_DELAY,
    );
  };

  /* View */

  return (
    <View style={{flex: 1, zIndex: -1}}>
      {currentBasemap ? (
        <Map
          allowMapViewMove={allowMapViewMove}
          basemap={currentBasemap}
          cameraRefCallback={cameraRefCallback}
          drawFeatures={drawFeatures}
          editFeatureVertex={editFeatureVertex}
          handleMapLongPress={handleMapLongPress}
          handleMapPress={handleMapPress}
          isShowMacrostratOverlay={isShowMacrostratOverlay}
          location={location}
          mapMode={mapMode}
          mapRef={mapRef}
          measureFeatures={measureFeatures}
          onMapLoad={handleMapLoadedWeb}  // prop used in web only
          onVertexLongPress={handleSelectedVertexLongPress}
          showUserLocation={showUserLocation}
          spotsNotSelected={spotsNotSelected}
          spotsSelected={spotsSelected}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
      ) : (
        <View style={{flex: 1, backgroundColor: '#E8E8E8'}}/>
      )}

      {/* Modals */}
      {currentBasemap?.source === 'macrostrat' && isOnline && (
        <MacrostratOverlay
          closeModal={() => setIsShowMacrostratOverlay(false)}
          isVisible={isShowMacrostratOverlay}
          location={location}
        />
      )}
      {/* Added View to fix issue with overlays moving off-screen after initial press ToDo: Check on this */}
      <View>
        {showSetInCurrentViewModal && (
          <SetInCurrentViewOverlay
            createDefaultGeomContinued={createDefaultGeomContinued}
            setShowSetInCurrentViewModal={setShowSetInCurrentViewModal}
            showSetInCurrentViewModal={showSetInCurrentViewModal}
          />
        )}
        {isShowVertexActionsModal && (
          <VertexActionsOverlay
            addNewVertex={addNewVertex}
            deleteSelectedVertex={deleteSelectedVertex}
            extendLineFromEndpoint={extendLineFromEndpoint}
            isShowVertexActionsModal={isShowVertexActionsModal}
            setIsShowVertexActionsModal={setIsShowVertexActionsModal}
            splitLine={splitLine}
            vertexActionValues={vertexActionValues}
          />
        )}
        {isShowSpotsAtPressModal && (
          <SelectSpotsAtPressModal
            closeModal={() => setIsShowSpotsAtPressModal(false)}
            headerTitle={isSpotsAtPressForEdit ? 'Select Spot to Edit' : `${spotsAtPress.length} Spots Here`}
            isVisible={isShowSpotsAtPressModal}
            onSpotPress={handleSpotAtPressSelected}
            spots={spotsAtPress}
          />
        )}
      </View>
    </View>
  );
});

export default React.memo(MapContainer);
