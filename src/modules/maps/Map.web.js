import React, {forwardRef, useEffect, useState} from 'react';

import 'mapbox-gl/dist/mapbox-gl.css';
import {Map as ReactMapGL, NavigationControl} from 'react-map-gl/mapbox';
import {useDispatch, useSelector} from 'react-redux';

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
  const isMapMoved = useSelector(state => state.map.isMapMoved);
  const stratSection = useSelector(state => state.map.stratSection);

  const {mapRef} = forwardedRef;

  const {isDrawMode} = useMap();
  const {cursor, handleMouseEnter, handleMouseLeave} = useMapMouseActions({editFeatureVertex, mapRef, mapMode});
  const {getInitialViewState} = useMapView();

  /* Local State */

  const [viewState, setViewState] = useState({});
  const {handleMapMoved} = useMapMoveEvents({setViewState});
  const [mapKey, setMapKey] = useState(0);

  /* Derived Variables */

  // Track map ID changes to force re-render and prevent layer conflicts
  const currentMapId = currentImageBasemap ? currentImageBasemap.id : stratSection ? stratSection.strat_section_id : basemap.id;

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

  // Add the image to the map style — registered once on mount to avoid duplicate listeners.
  useEffect(() => {
    const mapRefCurrent = mapRef.current;
    if (!mapRefCurrent) return;
    const handleStyleImageMissing = (e) => {
      const id = e.id;
      if (!mapRefCurrent.hasImage(id)) {
        mapRefCurrent.loadImage(symbols[id], (error, image) => {
          if (error) throw error;
          if (!mapRefCurrent.hasImage(id)) {
            mapRefCurrent.addImage(id, image);
            if (mapRefCurrent.hasImage(id)) console.log('Added Image:', id);
          }
        });
      }
    };
    mapRefCurrent.on('styleimagemissing', handleStyleImageMissing);
    return () => mapRefCurrent.off('styleimagemissing', handleStyleImageMissing);
  }, []);

  /* View */

  return (
    <ReactMapGL
      {...viewState}
      boxZoom={allowMapViewMove}
      cursor={cursor}
      doubleClickZoom={!(isDrawMode(mapMode) || mapMode === MAP_MODES.EDIT)}
      dragPan={allowMapViewMove}
      dragRotate={false}
      id={currentMapId}
      interactiveLayerIds={[...LAYER_IDS_NOT_SELECTED, ...LAYER_IDS_SELECTED]}
      key={`web-map-${mapKey}-${currentMapId}`}
      mapStyle={currentImageBasemap || stratSection ? BACKGROUND : basemap}
      mapboxAccessToken={MAPBOX_TOKEN}
      onClick={handleMapPress}
      onDblClick={handleMapLongPress}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMoveEnd={handleMapMoved}   // Update spots in extent and saved view (center and zoom)
      pitchWithRotate={false}
      ref={mapRef}
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
  );
};

export default forwardRef(Map);
