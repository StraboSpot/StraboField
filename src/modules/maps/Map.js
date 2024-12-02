import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Platform, View} from 'react-native';

import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import Basemap from './Basemap';
import useCustomMap from './custom-maps/useCustomMap';
import MacrostratOverlay from './macrostrat/MacrostratOverlay';
import {ZOOM} from './maps.constants';
import {setSpotsInMapExtentIds} from './maps.slice';
import useMapsOffline from './offline-maps/useMapsOffline';
import SetInCurrentViewOverlay from './SetInCurrentViewOverlay';
import useMap from './useMap';
import useMapCoords from './useMapCoords';
import useMapFeaturesCalculated from './useMapFeaturesCalculated';
import useMapFeaturesDraw from './useMapFeaturesDraw';
import useMapLocation from './useMapLocation';
import useMapPressEvents from './useMapPressEvents';
import useMapView from './useMapView';
import {isEmpty} from '../../shared/Helpers';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';
import {useImages} from '../images';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpot} from '../spots/spots.slice';

const Map = forwardRef(({
                          isSelectingForStereonet,
                          isSelectingForTagging,
                          mapMode,
                          onEndDrawPressed,
                          setDistance,
                          setMapModeToEdit,
                        }, mapComponentRef) => {
  console.log('Rendering Map...');

  const cameraRef = useRef(null);
  const mapRef = useRef(null);
  const spotsRef = useRef(null);

  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const customBasemap = useSelector(state => state.map.customMaps);
  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const stratSection = useSelector(state => state.map.stratSection);
  const userEmail = useSelector(state => state.user.email);

  const [isZoomToCenterOffline, setIsZoomToCenterOffline] = useState(false);
  const [measureFeatures, setMeasureFeatures] = useState([]);
  const [showSetInCurrentViewModal, setShowSetInCurrentViewModal] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [isShowMacrostratOverlay, setIsShowMacrostratOverlay] = useState(false);

  const {setCustomMapSwitchValue} = useCustomMap();
  const {setImageHeightAndWidth} = useImages();
  const {getExtentAndZoomCall, setBasemap} = useMap();
  const {convertFeatureGeometryToImagePixels} = useMapCoords();
  const {getLassoedSpots} = useMapFeaturesCalculated(mapRef);
  const {
    allowMapViewMove,
    cancelDraw,
    cancelEdits,
    clearSelectedSpots,
    clearVertexes,
    drawFeatures,
    editFeatureVertex,
    editSpot,
    endDraw,
    getSpotToEdit,
    moveVertex,
    saveEdits,
    setDrawFeaturesNew,
    spotsNotSelected,
    spotsSelected,
    startEditing,
    switchToEditing,
  } = useMapFeaturesDraw({
    isSelectingForStereonet: isSelectingForStereonet,
    isSelectingForTagging: isSelectingForTagging,
    mapMode: mapMode,
    mapRef: mapRef,
    onEndDrawPressed: onEndDrawPressed,
  });
  const {
    handleMapLongPress,
    handleMapPress,
    location,
  } = useMapPressEvents({
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
  });
  const {getCurrentLocation} = useMapLocation();
  const {setMapView, zoomToSpotsNow} = useMapView();
  const {getMapCenterTile, switchToOfflineMap} = useMapsOffline();

  useEffect(() => {
    spotsRef.current = [...spotsSelected, ...spotsNotSelected];
  }, [spotsSelected, spotsNotSelected]);

  useEffect(() => {
    // console.log('UE Map [currentImageBasemap]', currentImageBasemap);
    if (currentImageBasemap && (!currentImageBasemap.height || !currentImageBasemap.width)) {
      setImageHeightAndWidth(currentImageBasemap).catch(console.error);
    }
  }, [currentImageBasemap]);

  useEffect(() => {
    // console.log('UE Map [currentBasemap, isZoomToCenterOffline]', currentBasemap, isZoomToCenterOffline);
    updateMapView().catch(err => console.warn('Error getting center of custom map:', err));
    if (currentBasemap !== 'macrostrat') setIsShowMacrostratOverlay(false);
  }, [currentBasemap, isZoomToCenterOffline]);

  useEffect(() => {
    console.log('UE Map [userEmail, isOnline]', userEmail, isOnline);
    if (isOnline && !currentBasemap) setBasemap().catch(console.error);
    else if (isOnline && currentBasemap) {
      // console.log('ITS IN THIS ONE!!!! -isOnline && currentBasemap');
      setBasemap(currentBasemap.id).catch((error) => {
        console.log('Error Setting Basemap', error);
        // Sentry.captureMessage('Something went wrong', error);
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('Error setting custom basemap.\n Setting basemap Mapbox Topo.' + error));
        dispatch(setIsErrorMessagesModalVisible(true));
        // setBasemap();
        // Sentry.captureException(error);
      });
    }
    else if (!isOnline && isOnline !== null && currentBasemap && Platform.OS !== 'web') {
      console.log('ITS IN THIS ONE!!!! -!isOnline && isOnline !== null && currentBasemap');
      Object.values(customBasemap).map((map) => {
        if (offlineMaps[map.id]?.id !== map.id) setCustomMapSwitchValue(false, map);
      });
      switchToOfflineMap().catch(error => console.log('Error Setting Offline Basemap', error));
    }
    clearVertexes();
  }, [userEmail, isOnline]);

  // Create a default geometry for a Spot that doesn't have geometry when 'Set in Current View' is clicked
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
      //Assign the promise unresolved first then get the data using the json method.
      console.log('sending this extent to server: ', extentString);
      console.log('sending zoom to server: ', zoomLevel);
      const tileCountApiCall = await fetch(getExtentAndZoomCall(extentString, zoomLevel));
      const tileCountThisScope = await tileCountApiCall.json();
      console.log('got count from server: ', tileCountThisScope);
      return tileCountThisScope;
    }
    catch (err) {
      console.error(err);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Error fetching data from tile count service.'));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
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

  // Calculate the Spots in the current map extent and send to redux
  const updateSpotsInMapExtent = async () => {
    if (mapRef && mapRef.current) {
      console.log('Updating spots in map extent...');
      const mapBounds = Platform.OS === 'web' ? await mapRef.current.getBounds().toArray()
        : await mapRef.current.getVisibleBounds();
      let right = mapBounds[0][0];
      let top = mapBounds[0][1];
      let left = mapBounds[1][0];
      let bottom = mapBounds[1][1];
      let bbox = [left, bottom, right, top];
      const bboxPoly = turf.bboxPolygon(bbox);
      const gotSpotsInMapExtent = getLassoedSpots(spotsRef.current, bboxPoly);
      const gotSpotsInMapExtentIds = gotSpotsInMapExtent.map(spot => spot.properties.id);
      dispatch(setSpotsInMapExtentIds(gotSpotsInMapExtentIds));
    }
  };

  const zoomToCenterOfflineTile = () => {
    setIsZoomToCenterOffline(true);
  };

  // Fly the map to the current location
  const zoomToCurrentLocation = async () => {
    if (cameraRef.current || Platform.OS === 'web') {
      console.log('%cFlying to location', 'color: red');
      const currentLocation = await getCurrentLocation();
      if (Platform.OS === 'web') {
        mapRef.current.flyTo(
          {center: [currentLocation.longitude, currentLocation.latitude], zoom: ZOOM, maxDuration: 2500});
      }
      else {
        const currentLocationAsPoint = turf.point([currentLocation.longitude, currentLocation.latitude]);
        await zoomToSpotsNow([currentLocationAsPoint], mapRef.current, cameraRef.current);
      }
    }
    else throw 'Error Getting Map Camera';
  };

  const zoomToCustomMap = (bbox, duration) => {
    const animationDuration = duration;
    if (bbox) {
      const bboxArr = bbox.split(',');
      if (Platform.OS === 'web') {
        mapRef.current?.fitBounds([[Number(bboxArr[0]), Number(bboxArr[1])], [Number(bboxArr[2]), Number(bboxArr[3])]],
          {padding: 100, duration: animationDuration || 1500});
      }
      else {
        cameraRef.current.fitBounds([Number(bboxArr[0]), Number(bboxArr[1])], [Number(bboxArr[2]), Number(bboxArr[3])],
          100, animationDuration || 1500);
      }
    }
    else {
      console.error('Error: not able to get Custom Map bbox coords...');
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Not able to zoom to custom map while offline.'));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
  };

  // Zoom map to the extent of given Spots
  const zoomToSpots = (spot) => {
    zoomToSpotsNow(spot, mapRef.current, cameraRef.current);
  };

  // Zoom map to the extent of the mapped Spots
  const zoomToSpotsExtent = () => {
    const spotsToZoomTo = [...spotsSelected, ...spotsNotSelected];
    zoomToSpotsNow(spotsToZoomTo, mapRef.current, cameraRef.current);
  };

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
      toggleUserLocation: toggleUserLocation,
      updateSpotsInMapExtent: updateSpotsInMapExtent,
      zoomToCenterOfflineTile: zoomToCenterOfflineTile,
      zoomToCurrentLocation: zoomToCurrentLocation,
      zoomToCustomMap: zoomToCustomMap,
      zoomToSpots: zoomToSpots,
      zoomToSpotsExtent: zoomToSpotsExtent,
    };
  });

  return (
    <View style={{flex: 1, zIndex: -1}}>
      {currentBasemap && (
        <Basemap
          allowMapViewMove={allowMapViewMove}
          basemap={currentBasemap}
          drawFeatures={drawFeatures}
          editFeatureVertex={editFeatureVertex}
          handleMapLongPress={handleMapLongPress}
          handleMapPress={handleMapPress}
          isShowMacrostratOverlay={isShowMacrostratOverlay}
          location={location}
          mapMode={mapMode}
          measureFeatures={measureFeatures}
          ref={{mapRef: mapRef, cameraRef: cameraRef}}
          showUserLocation={showUserLocation}
          spotsNotSelected={spotsNotSelected}
          spotsSelected={spotsSelected}
        />
      )}
      {currentBasemap?.source === 'macrostrat' && isOnline && (
        <MacrostratOverlay
          closeModal={() => setIsShowMacrostratOverlay(false)}
          isVisible={isShowMacrostratOverlay}
          location={location}
        />
      )}
      {showSetInCurrentViewModal && (
        <SetInCurrentViewOverlay
          createDefaultGeomContinued={createDefaultGeomContinued}
          setShowSetInCurrentViewModal={setShowSetInCurrentViewModal}
          showSetInCurrentViewModal={showSetInCurrentViewModal}
        />
      )}
    </View>
  );
});

export default Map;
