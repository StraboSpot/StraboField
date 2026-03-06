import React, {forwardRef, useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import MapboxGL from '@rnmapbox/maps';
import {useSelector} from 'react-redux';

import {MapLayers} from './layers';
import {BACKGROUND, MAP_MODES, MAPBOX_TOKEN} from './maps.constants';
import mapStyles from './maps.styles';
import useMapMoveEvents from './useMapMoveEvents';
import VertexDrag from './VertexDrag';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import homeStyles from '../home/home.style';
import FreehandSketch from '../sketch/FreehandSketch';

MapboxGL.setAccessToken(MAPBOX_TOKEN);

const scaleBarPosition = SMALL_SCREEN ? {top: 20, left: 70} : {bottom: 20, left: 80};

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

  const {currentImageBasemap, zoom, stratSection, vertexStartCoords} = useSelector(state => state.map);

  const {mapRef, cameraRef} = forwardedRef;

  const {handleMapMoved} = useMapMoveEvents({mapRef});

  /* Local State */

  const [isStratStyleLoaded, setIsStratStyleLoaded] = useState(false);

  /* Derived Variables */

  // Track map ID changes to force re-render and prevent layer conflicts
  const currentMapId = currentImageBasemap ? currentImageBasemap.id : stratSection ? stratSection.strat_section_id : basemap.id;
  const zoomTextStyle = basemap.id === 'mapbox.satellite' ? homeStyles.currentZoomTextWhite
    : homeStyles.currentZoomTextBlack;

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

  /* Event Handlers */

  // Set flag for when the map has been loaded
  // This is a fix for patterns loading too slowly after v10 update
  // ToDo: Check if this bug is fixed in rnmapbox and therefore can be removed
  const onDidFinishLoadingMap = () => {
    stratSection ? setIsStratStyleLoaded(true) : setIsStratStyleLoaded(false);
  };

  /* View */

  return (
    <>
      {!stratSection && !currentImageBasemap && zoom && (
        <View
          style={SMALL_SCREEN ? homeStyles.zoomAndScaleBarContainerSmallScreen : homeStyles.zoomAndScaleBarContainer}
        >
          <Text style={zoomTextStyle}>Zoom: </Text>
          <Text style={zoomTextStyle}>{zoom.toFixed(1)}</Text>
        </View>
      )}
      <MapboxGL.MapView
        animated={true}
        attributionEnabled={true}
        attributionPosition={homeStyles.mapboxAttributionPosition}
        id={currentMapId}
        localizeLabels={true}
        logoEnabled={true}
        logoPosition={homeStyles.mapboxLogoPosition}
        onCameraChanged={handleMapMoved}  // Update spots in extent and saved view (center and zoom)
        onDidFinishLoadingMap={onDidFinishLoadingMap}
        onLongPress={handleMapLongPress}
        onPress={handleMapPress}
        pitchEnabled={false}
        ref={mapRef}
        rotateEnabled={false}
        scaleBarEnabled={!currentImageBasemap && !stratSection}
        scaleBarPosition={scaleBarPosition}
        scrollEnabled={allowMapViewMove}
        style={mapStyles.map}
        styleURL={currentImageBasemap || stratSection ? JSON.stringify(BACKGROUND) : JSON.stringify(basemap)}
        zoomEnabled={allowMapViewMove}
      >
        <MapLayers
          basemap={basemap}
          drawFeatures={drawFeatures}
          editFeatureVertex={editFeatureVertex}
          isShowMacrostratOverlay={isShowMacrostratOverlay}
          isStratStyleLoaded={isStratStyleLoaded}
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
      {(mapMode === MAP_MODES.DRAW.FREEHANDPOLYGON || mapMode === MAP_MODES.DRAW.FREEHANDLINE)
        && (
          <FreehandSketch mapMode={mapMode}>
            <MapboxGL.RasterLayer id={'sketchLayer'}/>
          </FreehandSketch>
        )}

      {vertexStartCoords && <VertexDrag/>}
    </>
  );
};

export default forwardRef(Map);
