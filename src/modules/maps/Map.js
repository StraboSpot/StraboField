import React, {forwardRef, useEffect, useState} from 'react';

import MapboxGL from '@rnmapbox/maps';
import {useSelector} from 'react-redux';

import MapControlsContainer from './controls/MapControlsContainer';
import {MapLayers} from './layers';
import {BACKGROUND, MAP_MODES, MAPBOX_TOKEN} from './maps.constants';
import mapStyles from './maps.styles';
import SnapLineLayer from './strat-section/SnapLineLayer';
import useMapMoveEvents from './useMapMoveEvents';
import VertexDrag from './VertexDrag';
import homeStyles from '../home/home.style';
import FreehandSketch from '../sketch/FreehandSketch';

MapboxGL.setAccessToken(MAPBOX_TOKEN);


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
               showUserLocation,
               spotsNotSelected,
               spotsSelected,
             }, forwardedRef) => {
  // console.log('Rendering Map...');

  /* Data Hooks */

  const {
    currentImageBasemap,
    zoom,
    stratSection,
    vertexStartCoords,
    intervalDragState,
    isDragIntervalMode,
  } = useSelector(state => state.map);

  const mapRef = forwardedRef?.mapRef ?? null;
  const cameraRef = forwardedRef?.cameraRef ?? null;

  const {handleMapMoved} = useMapMoveEvents({mapRef});

  /* Local State */

  const [scaleBarZoom, setScaleBarZoom] = useState(zoom);

  /* Event Handlers */

  const onCameraChanged = (e) => {
    setScaleBarZoom(e.properties.zoom);
    handleMapMoved(e);     // Update spots in extent and saved view (center and zoom)
  };

  /* Derived Variables */

  // Track map ID changes to force re-render and prevent layer conflicts
  const currentMapId = currentImageBasemap?.id || stratSection?.strat_section_id || basemap.id;

  /* Side Effects */

  useEffect(() => {
    console.log('isShowMacrostratOverlay', isShowMacrostratOverlay);
  }, [isShowMacrostratOverlay, basemap]);

  useEffect(() => {
    console.log('Map ID changed to:', currentMapId);
  }, [currentMapId]);

  // Cleanup map ref when component unmounts to prevent memory leaks
  useEffect(() => {
    const currentMapRef = mapRef?.current;
    return () => {
      // Give time for cleanup before unmounting
      if (currentMapRef) {
        console.log('Cleaning up map reference');
      }
    };
  }, [mapRef]);

  /* View */

  return (
    <>
      {!currentImageBasemap && !stratSection && <MapControlsContainer zoom={scaleBarZoom}/>}
      <MapboxGL.MapView
        animated={true}
        attributionEnabled={true}
        attributionPosition={homeStyles.mapboxAttributionPosition}
        id={currentMapId}
        localizeLabels={true}
        logoEnabled={true}
        logoPosition={homeStyles.mapboxLogoPosition}
        onCameraChanged={onCameraChanged}
        onLongPress={handleMapLongPress}
        onPress={handleMapPress}
        pitchEnabled={false}
        ref={mapRef}
        rotateEnabled={false}
        scaleBarEnabled={false}
        scrollEnabled={allowMapViewMove && !isDragIntervalMode}
        style={mapStyles.map}
        styleURL={currentImageBasemap || stratSection ? JSON.stringify(BACKGROUND) : JSON.stringify(basemap)}
        zoomEnabled={allowMapViewMove && !isDragIntervalMode}
      >
        <MapLayers
          basemap={basemap}
          drawFeatures={drawFeatures}
          editFeatureVertex={editFeatureVertex}
          isShowMacrostratOverlay={isShowMacrostratOverlay}
          location={location}
          mapMode={mapMode}
          measureFeatures={measureFeatures}
          ref={cameraRef}
          showUserLocation={showUserLocation}
          spotsNotSelected={spotsNotSelected}
          spotsSelected={spotsSelected}
        />
      </MapboxGL.MapView>

      {/* Sketch Layer */}
      {(mapMode === MAP_MODES.DRAW.FREEHANDPOLYGON || mapMode === MAP_MODES.DRAW.FREEHANDLINE) && (
        <FreehandSketch mapMode={mapMode}>
          <MapboxGL.RasterLayer id={'sketchLayer'}/>
        </FreehandSketch>
      )}

      {vertexStartCoords && <VertexDrag/>}
      {intervalDragState && <SnapLineLayer/>}
    </>
  );
};

export default forwardRef(Map);
