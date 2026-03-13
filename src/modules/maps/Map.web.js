import React, {forwardRef, useCallback, useEffect, useState} from 'react';

import 'mapbox-gl/dist/mapbox-gl.css';
import {Map as ReactMapGL, NavigationControl} from 'react-map-gl/mapbox';
import {useDispatch, useSelector} from 'react-redux';

import IntervalDrag from './IntervalDrag';
import {MapLayers} from './layers';
import {BACKGROUND, LAYER_IDS_NOT_SELECTED, LAYER_IDS_SELECTED, MAP_MODES, MAPBOX_TOKEN} from './maps.constants';
import {setIsMapMoved} from './maps.slice';
import {STRAT_PATTERNS} from './strat-section/stratSection.constants';
import {MAP_SYMBOLS} from './symbology/mapSymbology.constants';
import useMap from './useMap';
import useMapMouseActions from './useMapMouseActions.web';
import useMapMoveEvents from './useMapMoveEvents';
import useMapView from './useMapView';

const symbols = {...MAP_SYMBOLS, ...STRAT_PATTERNS};

const Map = ({
               allowMapViewMove,
               basemap,
               drawFeatures,
               editFeatureVertex,
               handleMapLongPress,
               handleMapPress,
               isShowMacrostratOverlay,
               location,
               mapMode,
               measureFeatures,
               spotsNotSelected,
               spotsSelected,
             }, forwardedRef) => {
  // console.log('Rendering Map...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const intervalDragState = useSelector(state => state.map.intervalDragState);
  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const isMapMoved = useSelector(state => state.map.isMapMoved);
  const stratSection = useSelector(state => state.map.stratSection);

  const {isDrawMode} = useMap();
  const {mapRef} = forwardedRef;
  const {cursor, handleMouseEnter, handleMouseLeave} = useMapMouseActions({editFeatureVertex, mapRef, mapMode});

  const [viewState, setViewState] = useState({});
  const {handleMapMoved} = useMapMoveEvents({setViewState});
  const {getInitialViewState} = useMapView();

  /* Local State */
  const [mapKey, setMapKey] = useState(0);

  /* Derived Variables */

  // Track map ID changes to force re-render and prevent layer conflicts
  const currentMapId = currentImageBasemap ? currentImageBasemap.id : stratSection ? stratSection.strat_section_id : basemap.id;

  /* Derived State */

  // Preload all symbol images when the map style finishes loading.
  const handleMapLoad = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.entries(symbols).forEach(([id, url]) => {
      if (!map.hasImage(id)) {
        map.loadImage(url, (error, image) => {
          if (error) {
            console.error('Error loading image:', id, error);
            return;
          }
          if (!map.hasImage(id)) map.addImage(id, image);
        });
      }
    });
  }, []);

  /* Side Effects */

  useEffect(() => {
      // console.log('UE Map', viewState);
      // console.log('Dimensions', useDimensions);
      if (!isMapMoved) dispatch(setIsMapMoved(true));
      setViewState(getInitialViewState());
    }, [currentImageBasemap, stratSection],
  );

  useEffect(() => {
    // Force map re-render when map ID changes to prevent layer conflicts
    setMapKey(prev => prev + 1);
    console.log('Web Map ID changed to:', currentMapId);
  }, [currentMapId]);

  /* View */

  return (
    <>
    <IntervalDrag mapRef={mapRef}/>
    <ReactMapGL
      {...viewState}
      boxZoom={allowMapViewMove && !isDragIntervalMode && !intervalDragState}
      cursor={cursor}
      doubleClickZoom={!(isDrawMode(mapMode) || mapMode === MAP_MODES.EDIT)}
      dragPan={allowMapViewMove && !isDragIntervalMode && !intervalDragState}
      dragRotate={false}
      id={currentMapId}
      interactiveLayerIds={[...LAYER_IDS_NOT_SELECTED, ...LAYER_IDS_SELECTED]}
      key={`web-map-${mapKey}-${currentMapId}`}
      mapStyle={currentImageBasemap || stratSection ? BACKGROUND : basemap}
      mapboxAccessToken={MAPBOX_TOKEN}
      onClick={handleMapPress}
      onDblClick={handleMapLongPress}
      onLoad={handleMapLoad}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMoveEnd={handleMapMoved}   // Update spots in extent and saved view (center and zoom)
      pitchWithRotate={false}
      ref={mapRef}
      scrollZoom={allowMapViewMove && !isDragIntervalMode && !intervalDragState}
      style={{flex: 1}}
      styleDiffing={false}
      touchPitch={false}
      touchZoomRotate={false}
    >
      <NavigationControl
        position={'bottom-left'}
        showCompass={false}
        style={{bottom: 75, left: 10, position: 'absolute'}}
        visualizePitch={false}
      />
      <MapLayers
        basemap={basemap}
        drawFeatures={drawFeatures}
        editFeatureVertex={editFeatureVertex}
        isShowMacrostratOverlay={isShowMacrostratOverlay}
        location={location}
        mapMode={mapMode}
        measureFeatures={measureFeatures}
        spotsNotSelected={spotsNotSelected}
        spotsSelected={spotsSelected}
      />
    </ReactMapGL>
    </>
  );
};

export default forwardRef(Map);
