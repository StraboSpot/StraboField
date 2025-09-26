import React, {forwardRef, useEffect, useState} from 'react';

import 'mapbox-gl/dist/mapbox-gl.css';
import {Map as ReactMapGL} from 'react-map-gl';
import {useDispatch, useSelector} from 'react-redux';

import {MapLayers} from './layers';
import {BACKGROUND, MAP_MODES, MAPBOX_TOKEN} from './maps.constants';
import {setIsMapMoved} from './maps.slice';
import {STRAT_PATTERNS} from './strat-section/stratSection.constants';
import {MAP_SYMBOLS} from './symbology/mapSymbology.constants';
import useMap from './useMap';
import useMapMouseActions from './useMapMouseActions.web';
import useMapMoveEvents from './useMapMoveEvents';
import useMapView from './useMapView';

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

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const isMapMoved = useSelector(state => state.map.isMapMoved);
  const stratSection = useSelector(state => state.map.stratSection);

  const {mapRef} = forwardedRef;

  const [viewState, setViewState] = React.useState({});
  const [mapKey, setMapKey] = useState(0);

  // Track map ID changes to force re-render and prevent layer conflicts
  const currentMapId = currentImageBasemap ? currentImageBasemap.id : stratSection ? stratSection.strat_section_id : basemap.id;

  const {isDrawMode} = useMap();
  const {handleMapMoved} = useMapMoveEvents({setViewState});
  const {cursor, handleMouseEnter, handleMouseLeave} = useMapMouseActions({editFeatureVertex, mapRef, mapMode});
  const {getInitialViewState} = useMapView();

  const layerIdsNotSelected = ['polygonLayerNotSelected', 'polygonLayerWithPatternNotSelected',
    'polygonLayerNotSelectedBorder', 'polygonLabelLayerNotSelected', 'lineLayerNotSelected',
    'lineLayerNotSelectedDotted', 'lineLayerNotSelectedDashed', 'lineLayerNotSelectedDotDashed',
    'lineLabelLayerNotSelected', 'pointLayerNotSelected'];
  const layerIdsSelected = ['polygonLayerSelected', 'polygonLayerWithPatternSelected',
    'polygonLayerSelectedBorder', 'polygonLabelLayerSelected', 'lineLayerSelected', 'lineLayerSelectedDotted',
    'lineLayerSelectedDashed', 'lineLayerSelectedDotDashed', 'lineLabelLayerSelected', 'pointLayerSelectedHalo'];
  const symbols = {...MAP_SYMBOLS, ...STRAT_PATTERNS};

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

  // Add the image to the map style.
  mapRef.current?.on('styleimagemissing', (e) => {
    const id = e.id;  // id of the missing image
    if (!mapRef.current?.hasImage(id)) {
      mapRef.current?.loadImage(
        symbols[id],
        (error, image) => {
          if (error) throw error;
          if (!mapRef.current?.hasImage(id)) {
            mapRef.current?.addImage(id, image);
            if (mapRef.current?.hasImage(id)) console.log('Added Image:', id);
          }
        },
      );
    }
  });

  return (
    <ReactMapGL
      {...viewState}
      boxZoom={allowMapViewMove}
      cursor={cursor}
      doubleClickZoom={!(isDrawMode(mapMode) || mapMode === MAP_MODES.EDIT)}
      dragPan={allowMapViewMove}
      dragRotate={false}
      id={currentMapId}
      key={`web-map-${mapKey}-${currentMapId}`}
      interactiveLayerIds={[...layerIdsNotSelected, ...layerIdsSelected]}
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
      <MapLayers
        basemap={basemap}
        drawFeatures={drawFeatures}
        editFeatureVertex={editFeatureVertex}
        isShowMacrostratOverlay={isShowMacrostratOverlay}
        location={location}
        measureFeatures={measureFeatures}
        spotsNotSelected={spotsNotSelected}
        spotsSelected={spotsSelected}
      />
    </ReactMapGL>
  );
};

export default forwardRef(Map);
